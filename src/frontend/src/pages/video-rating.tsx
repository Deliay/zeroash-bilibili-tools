import { useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { Card, CardFooter } from "@heroui/card";
import { Image } from "@heroui/image";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

import DefaultLayout from "@/layouts/default";
import { useTitle } from "@/util/title-provider";

interface VideoParseResult {
  title: string;
  author: string;
  image: string;
  url: string;
}

interface VideoCategories {
  [x: string]: { [bv: string]: VideoParseResult };
  夯爆了: { [bv: string]: VideoParseResult };
  夯: { [bv: string]: VideoParseResult };
  顶级: { [bv: string]: VideoParseResult };
  人上人: { [bv: string]: VideoParseResult };
  NPC: { [bv: string]: VideoParseResult };
  拉: { [bv: string]: VideoParseResult };
  拉完了: { [bv: string]: VideoParseResult };
}

const color: Record<string, string> = {
  夯爆了: "bg-[#8f0000]",
  夯: "bg-[#c00000]",
  顶级: "bg-[#ffc000]",
  人上人: "bg-[#ffd24b]",
  NPC: "bg-[#fedf82]",
  拉: "bg-[#aeadad]",
  拉完了: "bg-[#ffffff]",
};

async function getVideoInfo(bv: string) {
  const existsBv = localStorage.getItem(bv);

  if (existsBv) {
    return JSON.parse(existsBv) as VideoParseResult;
  }
  const res = await fetch(
    `https://ayelet-tools.fffdan.com/api/v1/bilibili/cover/${bv}`,
    {
      credentials: "omit",
    },
  );

  const result = (await res.json()) as VideoParseResult;

  localStorage.setItem(bv, JSON.stringify(result));

  return result;
}

const init = () =>
  ({
    夯爆了: {},
    夯: {},
    顶级: {},
    人上人: {},
    NPC: {},
    拉: {},
    拉完了: {},
  }) as VideoCategories;

const key = "RATED_VIDEOS";

function removeFromCategory(data: VideoCategories, bv: string) {
  for (const [, records] of Object.entries(data)) {
    delete records[bv];
  }

  return Object.assign({}, data);
}

function setBvToCategory(
  data: VideoCategories,
  category: string,
  bv: string,
  info?: VideoParseResult,
) {
  for (const [, records] of Object.entries(data)) {
    if (!info && records[bv]) {
      info = records[bv];
    }
    delete records[bv];
  }
  data[category][bv] = info!;

  return Object.assign({}, data);
}

function get() {
  const str = localStorage.getItem(key);

  if (!str) {
    return set(init());
  } else {
    return JSON.parse(str) as VideoCategories;
  }
}

function set(value: VideoCategories) {
  localStorage.setItem(key, JSON.stringify(value));

  return value;
}

function VideoCard({
  video,
  setRate,
  rate,
  bv,
}: {
  bv: string;
  video: VideoParseResult;
  setRate: (rates: VideoCategories) => void;
  rate: VideoCategories;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bv,
  });

  function removeVideo() {
    setRate(set(removeFromCategory(rate, bv)));
  }

  return (
    <div
      ref={setNodeRef}
      className="overflow-hidden h-40 min-w-60 w-60 hover:[&>button]:visible"
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      {...listeners}
      {...attributes}
    >
      <Button
        isIconOnly
        className="fixed invisible text-tiny text-white bg-black/20 z-50"
        color="default"
        size="sm"
        variant="flat"
        onPress={removeVideo}
      >
        x
      </Button>
      <Card isFooterBlurred className="border-none min-h-40" radius="lg">
        <Image
          alt="video.title"
          className="object-cover min-h-40"
          src={video.image}
        />
        <CardFooter className="justify-between bg-black/75 before:bg-black/75 overflow-hidden py-1 absolute before:rounded-t-sm rounded-t-sm bottom-0 w-full z-10 h-10">
          <a
            className="text-white max-w-60 w-full overflow-hidden text-ellipsis whitespace-nowrap"
            href={video.url}
            rel="noreferrer"
            target="_blank"
          >
            <span className="text-sm text-ellipsis">{video.title}</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}

function Rating({
  title,
  videos,
  setRate,
  rate,
}: {
  title: string;
  videos: { [bv: string]: VideoParseResult };
  setRate: (rates: VideoCategories) => void;
  rate: VideoCategories;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: title });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "grid grid-flow-col justify-start align-middle items-center",
        isOver ? "bg-white/30" : "",
      )}
      id={title}
    >
      <div
        className={clsx("h-full max-w-40 min-w-40 text-black", color[title])}
      >
        <div className="w-full h-full flex justify-center align-middle items-center text-2xl">
          {title}
        </div>
      </div>
      <div className="w-full flex flex-wrap grow min-h-20 gap-2 p-2">
        {Object.entries(videos).map(([bv, video]) => (
          <VideoCard
            key={bv}
            bv={bv}
            rate={rate}
            setRate={setRate}
            video={video}
          />
        ))}
      </div>
    </div>
  );
}

function tryGetBv(str: string) {
  const result = /\/(BV.*?)(\/|$|\?)/gm.exec(str);

  if (result) return result[1];

  return null;
}

export default function VideoRating() {
  const { setPageName } = useTitle();

  useEffect(() => setPageName("视频从夯到拉"));

  const [rate, setRate] = useState<VideoCategories>(null!);
  const [bv, setBv] = useState<string>("");
  const [category, setCategory] = useState<string>("人上人");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rate) setRate(get());
  });

  function handleBvChange(str: string) {
    if (!str.startsWith("BV") || str.length > 15) {
      const result = tryGetBv(str);

      if (result) {
        setBv(result);

        return;
      }
    }
    setBv(str);
  }

  async function handleAdd() {
    setLoading(true);
    if (!bv.startsWith("BV")) {
      addToast({
        title: "请输入正确的BV号",
        description: "例如 BV1gyBQBZEFs",
        timeout: 2000,
        color: "warning",
      });

      setLoading(false);

      return;
    }
    const info = await getVideoInfo(bv);

    setRate(set(setBvToCategory(rate, category, bv, info)));
    setLoading(false);
  }

  function handleDrag(ev: DragEndEvent) {
    const bv = ev.active.id as string;

    if (!bv) return;
    if (!ev.over) {
      setRate(set(removeFromCategory(rate, bv)));

      return;
    }

    const target = ev.over.id as string;

    setRate(set(setBvToCategory(rate, target, bv)));
  }

  return (
    <DefaultLayout>
      <DndContext onDragEnd={handleDrag}>
        <div className="w-full p-4">
          <div className="w-full flex justify-center pb-4">
            <div className="flex justify-center items-start align-baseline w-1/2 gap-2">
              <Input
                className="w-60 min-w-32"
                placeholder="输入BV号"
                value={bv}
                onValueChange={handleBvChange}
              />
              <Select
                className="max-w-32 min-w-24"
                items={Object.keys(color).map((key) => ({ key, label: key }))}
                selectedKeys={new Set([category])}
                selectionMode="single"
                onSelectionChange={([item]) =>
                  setCategory(`${item || category || "人上人"}`)
                }
              >
                {(category) => <SelectItem>{category.label}</SelectItem>}
              </Select>
              <Button
                color="primary"
                disabled={loading}
                isLoading={loading}
                onPress={handleAdd}
              >
                添加
              </Button>
              {/* <Button>导出HTML</Button> */}
            </div>
          </div>
          <div className="w-full border border-white/50 rounded-2xl overflow-hidden">
            {rate ? (
              Object.entries(rate).map(([title, videos]) => (
                <Rating
                  key={title}
                  rate={rate}
                  setRate={setRate}
                  title={title}
                  videos={videos}
                />
              ))
            ) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
      </DndContext>
    </DefaultLayout>
  );
}

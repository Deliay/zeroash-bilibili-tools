import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { addToast } from "@heroui/toast";
import { useState } from "react";

import useRating, { RateItem } from "@/contexts/rating-context";

async function getVideoInfoCore(bv: string) {
  const existsBv = localStorage.getItem(bv);

  if (existsBv) {
    return JSON.parse(existsBv) as RateItem;
  }
  const res = await fetch(
    `https://ayelet-tools.fffdan.com/api/v1/bilibili/cover/${bv}`,
    {
      credentials: "omit",
    },
  );

  const result = (await res.json()) as RateItem;

  localStorage.setItem(bv, JSON.stringify(result));

  return result;
}

function getVideoInfo(bv: string) {
  return getVideoInfoCore(bv).then((result) => {
    if (!result.id) result.id = bv;
    if (!result.type) result.type = "bilibili-video";

    return result;
  });
}

function tryGetBv(str: string) {
  const result = /\/(BV.*?)(\/|$|\?)/gm.exec(str);

  if (result) return result[1];

  return null;
}

export default function BilibiliVideoProvider() {
  const { rates, addItem } = useRating();
  const [bv, setBv] = useState<string>("");
  const [category, setCategory] = useState<string>(Object.keys(rates)[0]);
  const [loading, setLoading] = useState(false);

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

    addItem(info, category);
    setLoading(false);
  }

  return (
    <div className="flex justify-start items-center align-middle w-full gap-2">
      <Input
        className="w-60 min-w-32"
        label="BV号"
        placeholder="输入BV号或粘贴视频地址"
        value={bv}
        onValueChange={handleBvChange}
      />
      <Select
        className="max-w-32 min-w-24"
        items={Object.keys(rates).map((key) => ({ key, label: key }))}
        label="分类"
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
  );
}

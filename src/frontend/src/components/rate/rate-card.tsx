import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Card, CardFooter } from "@heroui/card";

import useRating, { RateItem } from "@/contexts/rating-context";

export default function RateItemCard({ item }: { item: RateItem }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });

  const { removeItem } = useRating();
  const remove = () => removeItem(item);

  return (
    <div
      ref={setNodeRef}
      className="overflow-hidden min-w-60 w-60 hover:[&>button]:visible"
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
        onPress={remove}
      >
        x
      </Button>
      <Card isFooterBlurred className="border-none min-h-40" radius="lg">
        <Image
          alt="video.title"
          className="object-cover min-h-40"
          src={item.image}
        />
        <CardFooter className="justify-between bg-black/75 before:bg-black/75 overflow-hidden py-1 absolute before:rounded-t-sm rounded-t-sm bottom-0 w-full z-10 h-10">
          <a
            className="text-white max-w-60 w-full overflow-hidden text-ellipsis whitespace-nowrap"
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            <span className="text-sm text-ellipsis">{item.title}</span>
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}

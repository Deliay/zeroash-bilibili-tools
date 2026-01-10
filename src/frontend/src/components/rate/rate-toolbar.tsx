import { useMemo, useState } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";

import BangumiSubjectProvider from "./provider/bangumi";
import BilibiliVideoProvider from "./provider/bilibili";

const dataProviders = {
  "bilibili.com": BilibiliVideoProvider,
  "bangumi.tv": BangumiSubjectProvider,
};

export default function RateToolbar() {
  const [provider, setProvider] =
    useState<keyof typeof dataProviders>("bilibili.com");
  const CurrentProvider = useMemo(() => dataProviders[provider], [provider]);

  return (
    <div className="w-full flex pb-4 items-center gap-4">
      <div className="w-32 max-w-64">
        <Select
          className="min-w-24 grow-[1]"
          items={Object.keys(dataProviders).map((key) => ({
            key,
            label: key,
          }))}
          label="数据源"
          selectedKeys={new Set([provider])}
          selectionMode="single"
          onSelectionChange={([item]) =>
            setProvider((item as any) || "bilibili.com")
          }
        >
          {(key) => <SelectItem>{key.label}</SelectItem>}
        </Select>
      </div>
      <div className="grow-[2]">
        <CurrentProvider />
      </div>
      <div className="grow-[1] flex justify-end">
        <Button>复制图片</Button>
      </div>
    </div>
  );
}

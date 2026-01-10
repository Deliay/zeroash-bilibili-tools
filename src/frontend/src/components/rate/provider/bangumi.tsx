import { useAsyncList } from "@react-stately/data";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";

import useRating, { RateItem } from "@/contexts/rating-context";

interface BangumiItem {
  id: number;
  name: string;
  name_cn: string;
  images: {
    common: string;
  };
}

function getName(item: BangumiItem) {
  if (item.name && item.name_cn) return `${item.name_cn} (${item.name})`;

  return item.name_cn || item.name || `${item.id}`;
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function searchDirect({
  filterText,
  signal,
}: {
  filterText?: string;
  signal: AbortSignal;
}) {
  if (!filterText || filterText.length === 0) return { items: [] };
  await delay(500);
  if (signal.aborted) return;
  console.log(`${filterText}`);
  
  const response = await fetch(
    "https://api.bgm.tv/v0/search/subjects?limit=20&offset=0",
    {
      method: "POST",
      body: JSON.stringify({
        keyword: filterText,
        sort: "heat",
        filter: {
          type: [2],
          nsfw: false,
        },
      }),
      headers: { "content-type": "application/json" },
      signal,
    },
  );

  const result = (await response.json()) as {
    data: Array<BangumiItem>;
  };

  return {
    items: result.data.map(
      (s) =>
        ({
          id: `${s.id}`,
          title: getName(s),
          author: "",
          image: s.images?.common || "",
          url: `https://bangumi.tv/subject/${s.id}`,
          type: "bangumi-subject",
        }) as RateItem,
    ),
  };
}

async function searchViaInnerApi({
  filterText,
  signal,
}: {
  filterText?: string;
  signal: AbortSignal;
}) {
  if (!filterText) return { items: [] };
  await delay(500);
  if (signal.aborted) return;
  const response = await fetch(
    `https://ayelet-tools.fffdan.com/api/v1/bangumi/subject/${filterText}`,
    { signal },
  );
  const items = (await response.json()) as Array<RateItem>;

  return { items };
}

export default function BangumiSubjectProvider() {
  const { addItem } = useRating();
  const list = useAsyncList<RateItem>({
    load: searchDirect,
  });

  return (
    <div className="flex justify-start items-center align-middle w-full gap-2">
      <Autocomplete
        inputValue={list.filterText}
        isLoading={list.isLoading}
        items={list.items}
        label="选择番剧"
        onInputChange={list.setFilterText}
        onSelectionChange={(itemKey) => {
          if (!itemKey) return;

          const item = list.getItem(itemKey);

          if (item) addItem(item);
        }}
      >
        {(item) => (
          <AutocompleteItem key={item.id}>
            <div className="flex">
              {item.image ? (
                <img alt="bangumi" className="w-10 h-16" src={item.image} />
              ) : (
                void 0
              )}
              <span>{item.title}</span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
}

import { createContext, useContext } from "react";
import { useImmer } from "use-immer";

export interface RateItem {
  id: string;
  title: string;
  author: string;
  image: string;
  url: string;
  type: "bangumi-subject" | "lastfm-track" | "bilibili-video" | null;
}
export type Rates = Record<string, RateItem[]>;

const key = "RATED_CATEGORIES";

const init = () =>
  ({
    夯爆了: [],
    夯: [],
    顶级: [],
    人上人: [],
    NPC: [],
    拉: [],
    拉完了: [],
  }) as Rates;

function get() {
  const str = localStorage.getItem(key);

  if (!str) {
    return set(init());
  } else {
    return JSON.parse(str) as Rates;
  }
}

function set(value: Rates) {
  localStorage.setItem(key, JSON.stringify(value));

  return value;
}

export const useEmptyRatingContext = () => {
  const [rates, updateRates] = useImmer<Rates>(get());

  function removeItem(item: RateItem) {
    updateRates((curr) => {
      for (const key in curr) {
        curr[key] = curr[key].filter((i) => i.id != item.id);
      }
      set(curr);
    });
  }

  function addItem(item: RateItem, category?: string) {
    if (!item.id) throw new Error("Id is required when adding to rate list");
    removeItem(item);
    const target = category || Object.keys(rates)[0];

    updateRates((curr) => {
      if (curr[target]) {
        curr[target].push(item);
      } else {
        curr[target] = [item];
      }

      set(curr);
    });
  }

  return { rates, addItem, removeItem };
};

export const RatingContext = createContext<
  ReturnType<typeof useEmptyRatingContext>
>(null!);

export default function useRating() {
  return useContext(RatingContext);
}

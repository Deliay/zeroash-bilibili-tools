import { useEffect } from "react";

import RateTable from "@/components/rate/rate-table";
import RateToolbar from "@/components/rate/rate-toolbar";
import {
  RatingContext,
  useEmptyRatingContext,
} from "@/contexts/rating-context";
import DefaultLayout from "@/layouts/default";
import { useTitle } from "@/util/title-provider";

export default function Rating() {
  const { setPageName } = useTitle();

  useEffect(() => setPageName("从夯到拉"));

  return (
    <DefaultLayout>
      <RatingContext.Provider value={useEmptyRatingContext()}>
        <div className="w-full p-4">
          <RateToolbar />
          <RateTable />
        </div>
      </RatingContext.Provider>
    </DefaultLayout>
  );
}

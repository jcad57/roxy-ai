import { Dispatch, SetStateAction } from "react";
import { LayoutId } from "../types/layout";

export const toggleView = (
  id: LayoutId,
  allIds: LayoutId[],
  setEnabledViews: Dispatch<SetStateAction<LayoutId[]>>
) => {
  setEnabledViews((prev) => {
    if (prev.includes(id)) {
      if (prev.length === 1) return prev; // always keep at least one
      return prev.filter((v) => v !== id);
    }
    // Re-insert in original order
    return allIds.filter((v) => prev.includes(v) || v === id);
  });
};

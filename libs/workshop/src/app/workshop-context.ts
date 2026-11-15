import { createContext, useContext } from "react";
import type { WorkshopId } from "./workshops";

export const WorkshopContext = createContext<WorkshopId>("music");

export function useWorkshopId(): WorkshopId {
  return useContext(WorkshopContext);
}

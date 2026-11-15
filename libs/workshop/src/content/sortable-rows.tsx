import { useId, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@freetsy/ui/components/button";
import { cn } from "@freetsy/ui/lib/utils";

const DRAG_ACTIVATION_DISTANCE = 4;

type Identified = { id: string };

export type SortableRowLabels = { reorder: string; remove: string };

export type SortableRowRender<Row> = {
  row: Row;
  number: number;
  update: (next: Row) => void;
};

type SortableRowsProps<Row extends Identified> = {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  createRow: () => Row;
  addLabel: string;
  labels: (number: number) => SortableRowLabels;
  renderRow: (render: SortableRowRender<Row>) => ReactNode;
  renderFooter?: (render: SortableRowRender<Row>) => ReactNode;
  children?: ReactNode;
};

function SortableRow<Row extends Identified>({
  render,
  labels,
  onRemove,
  renderRow,
  renderFooter,
}: {
  render: SortableRowRender<Row>;
  labels: SortableRowLabels;
  onRemove: () => void;
  renderRow: SortableRowsProps<Row>["renderRow"];
  renderFooter: SortableRowsProps<Row>["renderFooter"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: render.row.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex flex-col gap-xs", isDragging && "relative z-10 bg-surface-raised")}
    >
      <div className={cn("flex items-center gap-s")}>
        <Button
          ref={setActivatorNodeRef}
          variant="ghost"
          size="icon"
          aria-label={labels.reorder}
          className={cn("cursor-grab touch-none self-stretch active:cursor-grabbing")}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon strokeWidth="var(--stroke-icon)" />
        </Button>
        {renderRow(render)}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={labels.remove}
          className={cn("self-stretch hover:text-accent")}
        >
          <Trash2Icon strokeWidth="var(--stroke-icon)" />
        </Button>
      </div>
      {renderFooter ? renderFooter(render) : null}
    </div>
  );
}

export function SortableRows<Row extends Identified>({
  rows,
  onChange,
  createRow,
  addLabel,
  labels,
  renderRow,
  renderFooter,
  children,
}: SortableRowsProps<Row>) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((row) => row.id === active.id);
    const to = rows.findIndex((row) => row.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(rows, from, to));
  }

  return (
    <div className={cn("flex flex-col gap-s")}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <div className={cn("flex flex-col gap-s")}>
            {rows.map((row, index) => (
              <SortableRow
                key={row.id}
                render={{
                  row,
                  number: index + 1,
                  update: (next) =>
                    onChange(rows.map((current) => (current.id === row.id ? next : current))),
                }}
                labels={labels(index + 1)}
                onRemove={() => onChange(rows.filter((current) => current.id !== row.id))}
                renderRow={renderRow}
                renderFooter={renderFooter}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="outline" size="sm" onClick={() => onChange([...rows, createRow()])}>
        <PlusIcon strokeWidth="var(--stroke-icon)" />
        {addLabel}
      </Button>
      {children}
    </div>
  );
}

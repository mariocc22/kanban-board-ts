import { useMemo, useState } from "react";
import PlusIcon from "../icons/PlusIcon";
import { Column, Id } from "../types";
import ColumnContainer from "./ColumnContainer";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";

function Kanban() {
  // this will be a list of columns of type Column
  const [columns, setColumns] = useState<Column[]>([]);

  // we using useMemo to memoize the value of columnsId so that it doesn't change on every render
  const columnsId = useMemo(
    () => columns.map((column) => column.id),
    [columns]
  );

  //   this state can be type of Column when grabbing and null when not grabbing
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);

  //   this hook will help us to distinguish between dragging a column and clicking on the delete icon, so we're saying: if the user clicks and drags more than 3px it means he's dragging the column and not clicking on the delete icon, otherwise if he drags less than 3px it means he's clicking on the delete icon
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, //3px
      },
    })
  );

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((column) => (
                <ColumnContainer
                  key={column.id}
                  column={column}
                  deleteColumn={deleteColumn}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={() => createColumn()}
            className="h-[60px] w-[350px] min-w-[350px] cursor-pointer rounded-lg bg-mainBackgroundColor border-2 border-columnBackgroundColor p-4 ring-rose-500 hover:ring-2 flex gap-2"
          >
            <PlusIcon /> Add Column
          </button>
        </div>

        {/* this is the overlay when use grab the card */}
        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                deleteColumn={deleteColumn}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );

  function createColumn() {
    const columnToAdd: Column = {
      id: generateId(),
      title: `Column ${columns.length + 1}`,
    };
    setColumns([...columns, columnToAdd]);
  }

  function deleteColumn(id: Id) {
    const filteredColumns = columns.filter((column) => column.id !== id);
    setColumns(filteredColumns);
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeColumnid = active.id;
    const overColumnId = over.id;
    if (activeColumnid === overColumnId) return;

    setColumns((columns) => {
      const activeColumnIndex = columns.findIndex(
        (column) => column.id === activeColumnid
      );
      const overColumnIndex = columns.findIndex(
        (column) => column.id === overColumnId
      );

      //   this function is from DND kit and it will move the column from activeColumnIndex to overColumnIndex and you have to pass them these 3 params
      return arrayMove(columns, activeColumnIndex, overColumnIndex);
    });
  }
}

function generateId(): number {
  // number between 0 and 10000
  return Math.floor(Math.random() * 10001);
}

export default Kanban;

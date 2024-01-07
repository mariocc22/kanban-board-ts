import { useMemo, useState } from "react";
import PlusIcon from "../icons/PlusIcon";
import { Column, Id, Task } from "../types";
import ColumnContainer from "./ColumnContainer";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import TaskCard from "./TaskCard";

function Kanban() {
  // this will be a list of columns of type Column
  const [columns, setColumns] = useState<Column[]>([]);

  // we using useMemo to memoize the value of columnsId so that it doesn't change on every render
  const columnsId = useMemo(
    () => columns.map((column) => column.id),
    [columns]
  );

  //  this will be a list of tasks of type Task inside column
  const [tasks, setTasks] = useState<Task[]>([]);

  //   this state can be type of Column when grabbing and null when not grabbing
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((column) => (
                <ColumnContainer
                  key={column.id}
                  column={column}
                  deleteColumn={deleteColumn}
                  updateColumn={updateColumn}
                  createTask={createTask}
                  tasks={tasks.filter((task) => task.columnId === column.id)}
                  deleteTask={delteTask}
                  updateTask={updateTask}
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
                updateColumn={updateColumn}
                createTask={createTask}
                tasks={tasks.filter(
                  (task) => task.columnId === activeColumn.id
                )}
                deleteTask={delteTask}
                updateTask={updateTask}
              />
            )}
            {activeTask && (
              <TaskCard
                task={activeTask}
                deleteTask={delteTask}
                updateTask={updateTask}
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

    const newTasks = tasks.filter((task) => task.columnId !== id);
    setTasks(newTasks);
  }

  function updateColumn(id: Id, title: string) {
    const updatedColumns = columns.map((column) => {
      if (column.id === id) {
        return { ...column, title };
      }
      return column;
    });
    setColumns(updatedColumns);
  }

  function delteTask(id: Id) {
    const filteredTasks = tasks.filter((task) => task.id !== id);
    setTasks(filteredTasks);
  }

  function updateTask(id: Id, content: string) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        return { ...task, content };
      }
      return task;
    });
    setTasks(updatedTasks);
  }

  function createTask(columnId: Id) {
    const taskToAdd: Task = {
      id: generateId(),
      columnId,
      content: `Task ${tasks.length + 1}`,
    };
    setTasks([...tasks, taskToAdd]);
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    // in this way when the drag ends we remove our drag overlay components
    setActiveColumn(null);
    setActiveTask(null);

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
  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overColumnId = over.id;

    if (activeId === overColumnId) return;

    const isActiveATask = active.data.current?.type === "task";
    const isOverATask = over.data.current?.type === "task";

    if (!isActiveATask) return;

    // 1. case: I'm dropping a task over another task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeTaskIndex = tasks.findIndex((task) => task.id === activeId);
        const overTaskIndex = tasks.findIndex(
          (task) => task.id === overColumnId
        );

        tasks[activeTaskIndex].columnId = tasks[overTaskIndex].columnId;

        return arrayMove(tasks, activeTaskIndex, overTaskIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "column";

    // 2. case: I'm dropping a task over a column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeTaskIndex = tasks.findIndex((task) => task.id === activeId);

        tasks[activeTaskIndex].columnId = overColumnId;

        return arrayMove(tasks, activeTaskIndex, activeTaskIndex);
      });
    }
  }
}

function generateId(): number {
  // number between 0 and 10000
  return Math.floor(Math.random() * 10001);
}

export default Kanban;

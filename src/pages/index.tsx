import { Button, Card, Input, InputGroup, Text } from "@parssa/universal-ui";
import { useEffect, useRef, useState } from "react";
import { ImSpinner3 } from "react-icons/im";

const DEFAULT_TASKS = [];

const StateVisualizer = ({ state, setState }: { state: any; setState?: (s: any) => void }) => {
  const selectedSet = new Set(state.selectedTaskIDs);

  return (
    <Card className="mt-4 overflow-hidden">
      {state.visibleTaskIDs.map((taskID, i) => {
        const task = state.tasks.find((task) => task.id === taskID);
        const selected = selectedSet.has(taskID);
        return (
          <Card.Content
            key={i}
            className={`flex items-center 
            ${selected ? "bg-theme-active/20" : "hover:bg-theme-base"}`}
            data-theme={selected ? "info" : "neutral"}
            onClick={() => {
              if (!setState) return;
              setState({
                ...state,
                selectedTaskIDs: selected
                  ? state.selectedTaskIDs.filter((id) => id !== taskID)
                  : state.selectedTaskIDs.concat(taskID)
              });
            }}
          >
            <Text
              onClick={(e) => {
                e.stopPropagation();
                if (!setState) return;
                setState({
                  ...state,
                  tasks: state.tasks.map((task) => {
                    if (task.id === taskID) return { ...task, completed: !task.completed };
                    return task;
                  })
                });
              }}
              className="pr-6 cursor-pointer"
            >
              {task.completed ? "✅" : "❌"}
            </Text>
            {task.icon && <Text className="mr-1.5">{task.icon}</Text>}
            <Text>{task.text}</Text>
            <div className="flex-grow" />
            <div className="flex items-center">
              <Text className="opacity-40">{new Date(task.createdAt).toDateString()}</Text>
            </div>
          </Card.Content>
        );
      })}
      {state.visibleTaskIDs.length === 0 && (
        <Card.Content className="text-center pt-size-2y pb-size-2y">
          <Text className="text-theme-active/60">No tasks found</Text>
          <div className="mt-size-2y">
            {state.tasks.length > 0 ? (
              <Text className="text-theme-active/60">
                Try saying &ldquo;Show all my tasks&rdquo;
              </Text>
            ) : (
              <Text>Try saying &ldquo;Add a task&rdquo;</Text>
            )}
          </div>
        </Card.Content>
      )}
      {state.tasks.length > state.visibleTaskIDs.length && (
        <Card.Content className="text-center pt-0">
          <Text size="sm" className="text-theme-active/60 border-theme-base/30 border-t pt-size-4y">
            {state.tasks.length - state.visibleTaskIDs.length} task
            {state.tasks.length - state.visibleTaskIDs.length > 1 ? "s" : ""} hidden
          </Text>
        </Card.Content>
      )}
    </Card>
  );
};

const HistoryVisualizer = ({
  history,
  onHistoryReturn
}: {
  history: { state: any; prompt: string }[];
  onHistoryReturn: (state: any) => void;
}) => {
  return (
    <div className="mt-4 space-y-4">
      {history.map((item, i) => (
        <div key={i} className="opacity-50 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center justify-between">
            <Text className="text-theme-active/60 italic">&ldquo;{item.prompt}&rdquo;</Text>

            <Button
              size="sm"
              variant="ghost"
              className="whitespace-nowrap"
              onClick={() => onHistoryReturn(item.state)}
            >
              Rewind
            </Button>
          </div>
          <StateVisualizer state={item.state} />
        </div>
      ))}
    </div>
  );
};

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState(false);

  const [state, setState] = useState({
    tasks: DEFAULT_TASKS,
    visibleTaskIDs: DEFAULT_TASKS.map((task) => task.id),
    selectedTaskIDs: []
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const state = localStorage.getItem("gpt-todo/state");
    if (state) setState(JSON.parse(state));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("gpt-todo/state", JSON.stringify(state));
  }, [state]);

  const onSendPrompt = () => {
    if (pending) return;
    setPending(true);

    fetch("/api/prompt", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        state,
        schema: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              props: {
                id: { type: "number" },
                text: { type: "string" },
                icon: { type: "string", comment: "emoji or ascii character" },
                completed: { type: "boolean" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
                parentID: {
                  type: "number",
                  comment: "ID of parent task"
                }
              }
            }
          },
          visibleTaskIDs: {
            type: "array",
            comment: "IDs of tasks that are visible to the user",
            items: { type: "number" }
          },
          selectedTaskIDs: {
            type: "array",
            comment: "IDs of tasks that are selected by the user",
            items: { type: "number" }
          }
        }
      })
    })
      .then((res) => res.json())
      .then((res) => {
        setState(res.state);
        setHistory([{ prompt, state: res.state }, ...history]);
        setActivePrompt(prompt);
        setPrompt("");
        inputRef.current?.focus();
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setTimeout(() => setError(false), 1000);
      })
      .finally(() => setPending(false));
  };
  return (
    <div className="container pt-24 md:pt-48">
      <Text variant="h1">GPTodo</Text>
      <div className="mt-size-4y">
        <div className="flex items-center gap-size-x">
          <InputGroup
            theme={error ? "error" : "brand"}
            className={`${error ? "animate-shake" : ""} w-full`}
          >
            <Input
              ref={inputRef}
              autoFocus
              className="w-full"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSendPrompt()}
              placeholder={`"Show all my tasks..."`}
              disabled={pending}
              trailingIcon={pending && <ImSpinner3 className="animate-spin w-full h-full" />}
            />
            <Button onClick={onSendPrompt} disabled={pending} className="whitespace-nowrap">
              Send Prompt
            </Button>
          </InputGroup>
          {activePrompt && (
            <div
              className="px-size-x py-size-y rounded bg-theme-active/40 w-max max-w-[24ch]"
              data-theme="info"
            >
              <Text className="text-theme-active/90 italic truncate">
                &ldquo;{activePrompt}&rdquo;
              </Text>
            </div>
          )}
        </div>
        <StateVisualizer state={state} setState={setState} />
        <div className="opacity-20 hover:opacity-100 transition-all duration-500">
          <div className="border-t border-theme-active/50 my-size-4y"></div>
          <div className="">
            <Text variant="h3">History</Text>
            <HistoryVisualizer history={history} onHistoryReturn={setState} />
          </div>
        </div>
      </div>
    </div>
  );
}

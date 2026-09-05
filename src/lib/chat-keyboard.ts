import type { KeyboardEvent } from "react";

export function handleChatKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, send: () => void, change: (value: string) => void) {
  if (event.key !== "Enter" || event.nativeEvent.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  if (event.ctrlKey || event.metaKey || event.shiftKey) {
    const field = event.currentTarget;
    const start = field.selectionStart;
    const value = field.value.slice(0, start) + "\n" + field.value.slice(field.selectionEnd);
    if (value.length > 2_000) return;
    change(value);
    requestAnimationFrame(() => field.setSelectionRange(start + 1, start + 1));
  } else if (!event.repeat) {
    send();
  }
}

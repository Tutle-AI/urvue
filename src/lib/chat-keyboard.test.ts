import { afterEach, describe, expect, it, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { handleChatKeyDown } from "./chat-keyboard";

afterEach(() => vi.unstubAllGlobals());

describe("chat keyboard", () => {
  function key(overrides = {}) {
    return { key: "Enter", nativeEvent: { isComposing: false }, preventDefault: vi.fn(), currentTarget: { value: "hello world", selectionStart: 5, selectionEnd: 6, setSelectionRange: vi.fn() }, ...overrides };
  }
  it("sends on Enter and prevents a newline", () => {
    const event = key();
    const send = vi.fn();
    handleChatKeyDown(event as unknown as KeyboardEvent<HTMLTextAreaElement>, send, vi.fn());
    expect(send).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
  it.each(["ctrlKey", "metaKey", "shiftKey"])("inserts a newline at the selection for %s", (modifier) => {
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
    const event = key({ [modifier]: true });
    const send = vi.fn();
    const change = vi.fn();
    handleChatKeyDown(event as unknown as KeyboardEvent<HTMLTextAreaElement>, send, change);
    expect(send).not.toHaveBeenCalled();
    expect(change).toHaveBeenCalledWith("hello\nworld");
    expect(event.currentTarget.setSelectionRange).toHaveBeenCalledWith(6, 6);
  });
  it.each([{ nativeEvent: { isComposing: true } }, { keyCode: 229 }, { repeat: true }])("does not send during composition or repeated Enter (%j)", (overrides) => {
    const send = vi.fn();
    handleChatKeyDown(key(overrides) as unknown as KeyboardEvent<HTMLTextAreaElement>, send, vi.fn());
    expect(send).not.toHaveBeenCalled();
  });
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { effects, scrollIntoView } = vi.hoisted(() => ({
  effects: [] as Array<() => unknown>,
  scrollIntoView: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => unknown) => { effects.push(effect); },
  useRef: () => ({ current: { scrollIntoView } }),
}));

import { FeedbackChat } from "./feedback-chat";

describe("feedback chat scrolling", () => {
  beforeEach(() => { effects.length = 0; scrollIntoView.mockReset(); });

  it.each([undefined, Promise.resolve()])("never returns the browser scroll result as React cleanup (%s)", (result) => {
    scrollIntoView.mockReturnValue(result);
    renderToStaticMarkup(<FeedbackChat slug="test-point" experienceType="Website" feedbackPointName="Test point" agentName="Amanda" />);
    expect(effects).toHaveLength(1);
    expect(effects[0]()).toBeUndefined();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});

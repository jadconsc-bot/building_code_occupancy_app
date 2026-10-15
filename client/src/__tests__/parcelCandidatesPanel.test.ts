// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { URL as NodeURL } from "node:url";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ParcelCandidatesPanel,
  type ParcelCandidatesPanelProps,
} from "../components/ParcelCandidatesPanel";
import {
  PARCEL_ATTRIBUTION,
  PARCEL_UNAVAILABLE_MESSAGE,
  parcelOutlines,
  type CandidateDiscovery,
  type DiscoveryReply,
} from "../components/parcelCandidates";

const fixture = (name: string): CandidateDiscovery =>
  JSON.parse(
    readFileSync(
      new NodeURL(`./fixtures/parcelDiscovery/${name}.json`, import.meta.url),
      "utf8"
    )
  );
const house = fixture("coral-shores");
afterEach(cleanup);

function setup(overrides: Partial<ParcelCandidatesPanelProps> = {}) {
  const props: ParcelCandidatesPanelProps = {
    projectAddress: house.query.normalized,
    municipality: "Calgary",
    discover: vi.fn().mockResolvedValue(house),
    onApply: vi.fn(),
    ...overrides,
  };
  return {
    ...render(React.createElement(ParcelCandidatesPanel, props)),
    props,
  };
}
const search = () =>
  fireEvent.click(screen.getByRole("button", { name: "Search parcels" }));
const apply = () =>
  screen.getByRole("button", {
    name: "Apply assessed area",
  }) as HTMLButtonElement;
const accounts = () => screen.getAllByRole("radio") as HTMLInputElement[];
const parcels = () => screen.getAllByRole("checkbox") as HTMLInputElement[];
async function loaded() {
  search();
  await screen.findAllByRole("radio");
}
function deferred() {
  let resolve!: (value: DiscoveryReply) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<DiscoveryReply>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("ParcelCandidatesPanel", () => {
  it("prefills the saved address, exposes a differing drawing address and does not search on mount", () => {
    const { props } = setup({
      projectAddress: "  Saved address SE  ",
      extractedAddress: "Drawing address NE",
    });
    expect(
      (
        screen.getByRole("textbox", {
          name: "Search address",
        }) as HTMLInputElement
      ).value
    ).toBe("  Saved address SE  ");
    expect(
      screen.getByText(/Drawing address differs: Drawing address NE/)
    ).toBeTruthy();
    expect(props.discover).not.toHaveBeenCalled();
    expect(apply().disabled).toBe(true);
    expect(
      document.getElementById(apply().getAttribute("aria-describedby")!)
        ?.textContent
    ).toContain("Search for an address");
  });

  it("falls back to the drawing address and leaves short addresses unsearchable", () => {
    setup({ projectAddress: null, extractedAddress: "Drawing address NE" });
    const input = screen.getByRole("textbox", { name: "Search address" });
    expect((input as HTMLInputElement).value).toBe("Drawing address NE");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(
      (
        screen.getByRole("button", {
          name: "Search parcels",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });

  it.each(["Edmonton", null])(
    "makes no discovery call for municipality %s, including a submitted form",
    municipality => {
      const { props } = setup({ municipality });
      search();
      fireEvent.submit(screen.getByRole("textbox").closest("form")!);
      expect(props.discover).not.toHaveBeenCalled();
      expect(apply().disabled).toBe(true);
      expect(screen.getByText(/available for Calgary only/)).toBeTruthy();
    }
  );

  it("sends the exact edited address only on explicit search and shows loading", async () => {
    const pending = deferred();
    const { props } = setup({
      municipality: "CALGARY, Alberta",
      discover: vi.fn().mockReturnValue(pending.promise),
    });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Another address SE  " },
    });
    search();
    expect(props.discover).toHaveBeenCalledExactlyOnceWith({
      address: "  Another address SE  ",
      municipality: "CALGARY, Alberta",
    });
    expect(screen.getByRole("status").textContent).toContain("Searching");
    expect(apply().disabled).toBe(true);
    await act(async () => pending.resolve(house));
    expect(
      screen.getByText("Results for: Another address SE", { exact: false })
    ).toBeTruthy();
  });

  it("shows recorded provenance, attribution and unselected account and parcel controls", async () => {
    setup();
    await loaded();
    expect(
      screen.getByText(/1 parcels · 1 accounts · 1 source rows/)
    ).toBeTruthy();
    expect(
      screen.getByText(/Current Year Property Assessments.*4bsw-nn7w/)
    ).toBeTruthy();
    expect(screen.getByText(PARCEL_ATTRIBUTION, { exact: false })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Licence" }).getAttribute("href")
    ).toBe(house.source.licenceUrl);
    expect(accounts()[0].checked).toBe(false);
    expect(parcels()[0].checked).toBe(false);
    expect(apply().disabled).toBe(true);
    expect(screen.getByRole("heading", { level: 4 }).textContent).toContain(
      `Results for: ${house.query.normalized}`
    );
    expect(
      screen.getByText("Outline only, not to scale for design")
    ).toBeTruthy();
    const north = screen
      .getByRole("img")
      .querySelector('[aria-label="North arrow"]')!;
    expect(north.querySelector("text")?.textContent).toBe("N");
    expect(north.querySelector("line")?.getAttribute("y2")).toBe("18");
    expect(north.querySelector("polyline")?.getAttribute("points")).toBe(
      "291,25 296,18 301,25"
    );
  });

  it("matches the literal recorded golden outline path with evenodd fill", async () => {
    setup();
    await loaded();
    // Recorded coral-shores path from outline-paths.golden.json; do not regenerate it.
    const expected =
      "M278.8,60.3 L268,50.2 L258.9,38.6 L251.6,25.8 L246.5,12 L41.2,72 L48.8,94.6 L58,116.6 L68.9,137.8 L81.4,158.1 L95.4,177.4 L110.8,195.5 L127.7,212.4 L145.7,228 L278.8,60.3 Z";
    const golden = JSON.parse(
      readFileSync(
        new NodeURL(
          "./fixtures/parcelDiscovery/outline-paths.golden.json",
          import.meta.url
        ),
        "utf8"
      )
    );
    expect(golden["coral-shores"][0].path).toBe(expected);
    const path = screen.getByRole("img").querySelector("path")!;
    expect(path.getAttribute("fill-rule")).toBe("evenodd");
    expect(path.getAttribute("d")).toBe(expected);
  });

  it("shows a missing-boundary message without inventing an outline", async () => {
    setup({
      discover: vi.fn().mockResolvedValue({
        ...house,
        parcels: [{ ...house.parcels[0], geometry: null }],
      }),
    });
    await loaded();
    expect(screen.getByText(/Boundary unavailable/)).toBeTruthy();
    expect(screen.getByRole("img").querySelector("path")).toBeNull();
  });

  it("requires all account parcels and applies only the chosen assessed area with exact provenance", async () => {
    const data = fixture("macleod");
    const { props } = setup({ discover: vi.fn().mockResolvedValue(data) });
    await loaded();
    fireEvent.click(accounts()[0]);
    expect(apply().disabled).toBe(true);
    expect(
      screen.getByText("Tick all parcels of this account (18 missing)")
    ).toBeTruthy();
    parcels().forEach(p => fireEvent.click(p));
    expect(apply().disabled).toBe(false);
    fireEvent.click(apply());
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith({
      areaM2: 23044.9,
      rollNumber: data.accounts[0].rollNumber,
      rollYear: 2026,
      cpids: data.accounts[0].cpids,
      searchedAddress: house.query.normalized,
      retrievedAt: data.retrievedAt,
      source: data.source,
    });
  });

  it("selects only one account and never totals areas from a shared parcel", async () => {
    const data = fixture("mcdougall");
    const { props } = setup({ discover: vi.fn().mockResolvedValue(data) });
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    fireEvent.click(accounts()[1]);
    expect(accounts().filter(a => a.checked)).toHaveLength(1);
    fireEvent.click(apply());
    const roll =
      accounts()[1].parentElement!.textContent!.match(/Account (\S+)/)![1];
    const account = data.accounts.find(a => a.rollNumber === roll)!;
    expect(account.rollNumber).toBe("069501484");
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith({
      areaM2: 386,
      rollNumber: "069501484",
      rollYear: 2026,
      cpids: ["100565132"],
      searchedAddress: "132 CORAL SHORES CA NE",
      retrievedAt: "2026-10-14T04:09:19.466Z",
      source: {
        dataset: "4bsw-nn7w",
        name: "Current Year Property Assessments (Parcel)",
        licenceUrl: "https://data.calgary.ca/d/Open-Data-Terms/u45n-7awa",
      },
    });
  });

  it("keeps truncated results blocked with the reason beside disabled Apply", async () => {
    setup({
      discover: vi.fn().mockResolvedValue({ ...house, truncated: true }),
    });
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    expect(apply().disabled).toBe(true);
    const reason = document.getElementById(
      apply().getAttribute("aria-describedby")!
    )!;
    expect(reason.textContent).toContain("Results are incomplete");
    expect(reason.parentElement).toBe(apply().parentElement);
    expect(screen.getByRole("alert").textContent).toContain(
      "Truncated results"
    );
  });

  it("shows an unusable-area reason beside disabled Apply", async () => {
    setup({
      discover: vi.fn().mockResolvedValue({
        ...house,
        accounts: [{ ...house.accounts[0], landSizeSqm: null }],
      }),
    });
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    expect(apply().disabled).toBe(true);
    expect(
      screen.getByText("Selected account has no usable assessed land area.")
        .parentElement
    ).toBe(apply().parentElement);
  });

  it("permits an account without CPIDs only while displaying its missing-identifier warning", async () => {
    setup({
      discover: vi.fn().mockResolvedValue({
        ...house,
        accounts: [{ ...house.accounts[0], cpids: [] }],
      }),
    });
    await loaded();
    fireEvent.click(accounts()[0]);
    expect(apply().disabled).toBe(false);
    expect(
      screen.getByText("This account has no parcel identifier.")
    ).toBeTruthy();
  });

  it.each([
    [{ status: "no_data" }, "No parcel candidates found."],
    [
      { status: "unsupported_municipality" },
      "Parcel search is available for Calgary only.",
    ],
    [null, PARCEL_UNAVAILABLE_MESSAGE],
    [{ error: "private backend error" }, PARCEL_UNAVAILABLE_MESSAGE],
  ] as const)(
    "handles discovery reply %j with a safe message and blocked Apply",
    async (reply, message) => {
      setup({ discover: vi.fn().mockResolvedValue(reply) });
      search();
      await screen.findByText(message, { exact: false });
      const nearSearch = screen.getByRole("status");
      expect(nearSearch.textContent).toContain(message);
      expect(
        screen.getByRole("textbox").closest("form")!.nextElementSibling
      ).toBe(nearSearch);
      expect(apply().disabled).toBe(true);
      expect(screen.queryByRole("radio")).toBeNull();
      expect(screen.queryByText("private backend error")).toBeNull();
    }
  );

  it("handles rejected discovery without exposing the error and allows retry", async () => {
    const discover = vi
      .fn()
      .mockRejectedValueOnce(new Error("private error"))
      .mockResolvedValueOnce(house);
    setup({ discover });
    search();
    await screen.findByText(PARCEL_UNAVAILABLE_MESSAGE);
    expect(apply().disabled).toBe(true);
    await loaded();
    expect(discover).toHaveBeenCalledTimes(2);
  });

  it("clears results and selections immediately when the address is edited", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    expect(apply().disabled).toBe(false);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New address SE" },
    });
    expect(apply().disabled).toBe(true);
    expect(screen.queryByRole("radio")).toBeNull();
    fireEvent.click(apply());
    expect(props.onApply).not.toHaveBeenCalled();
  });

  it("clears prior selections on a new search without automatically applying an area", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    await loaded();
    expect(parcels()[0].checked).toBe(false);
    expect(accounts()[0].checked).toBe(false);
    expect(apply().disabled).toBe(true);
    expect(props.onApply).not.toHaveBeenCalled();
  });

  it("keeps account ordering and outlines stable when discovery returns reversed arrays", async () => {
    const data = fixture("mcdougall");
    const { container } = setup({
      discover: vi.fn().mockResolvedValue({
        ...data,
        accounts: [...data.accounts].reverse(),
        parcels: [...data.parcels].reverse(),
      }),
    });
    await loaded();
    expect(
      accounts().map(
        account =>
          account.parentElement!.textContent?.match(/Account (\S+)/)![1]
      )
    ).toEqual(["069501468", "069501484"]);
    expect(
      [...container.querySelectorAll("path")].map(path =>
        path.getAttribute("d")
      )
    ).toEqual(
      parcelOutlines(data.parcels)
        .filter(outline => outline.path)
        .map(outline => outline.path)
    );
  });

  it("discards a pending response after an address edit even without another search", async () => {
    const pending = deferred();
    setup({ discover: vi.fn().mockReturnValue(pending.promise) });
    search();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Unsearched address SE" },
    });
    await act(async () => pending.resolve(house));
    expect(screen.queryByRole("radio")).toBeNull();
    expect(apply().disabled).toBe(true);
  });

  it("keeps B's results after searching A, editing to B, resolving B and then resolving A", async () => {
    const first = deferred(),
      second = deferred();
    const discover = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const responseA = fixture("mcdougall");
    const responseB = house;
    const { props } = setup({ projectAddress: "Address A SE", discover });
    search();
    expect(discover).toHaveBeenNthCalledWith(1, {
      address: "Address A SE",
      municipality: "Calgary",
    });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Address B SE" },
    });
    search();
    expect(discover).toHaveBeenNthCalledWith(2, {
      address: "Address B SE",
      municipality: "Calgary",
    });
    await act(async () => {
      second.resolve(responseB);
      await second.promise;
    });
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    await act(async () => {
      first.resolve(responseA);
      await first.promise;
    });
    expect(screen.getByRole("heading", { level: 4 }).textContent).toBe(
      "Results for: Address B SE · Roll year: 2026 · Retrieved 2026-10-14 04:09 UTC"
    );
    expect(accounts()).toHaveLength(1);
    expect(accounts()[0].parentElement!.textContent).toContain(
      "Account 507123305"
    );
    expect(parcels()).toHaveLength(1);
    expect(parcels()[0].parentElement!.textContent).toContain(
      "Parcel 100570855"
    );
    expect(screen.queryByText(/Account 069501468/)).toBeNull();
    expect(accounts()[0].checked).toBe(true);
    expect(parcels()[0].checked).toBe(true);
    expect(apply().disabled).toBe(false);
    fireEvent.click(apply());
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith({
      areaM2: 654.4,
      rollNumber: "507123305",
      rollYear: 2026,
      cpids: ["100570855"],
      searchedAddress: "Address B SE",
      retrievedAt: responseB.retrievedAt,
      source: responseB.source,
    });
    expect(discover).toHaveBeenCalledTimes(2);
  });

  it("ignores a stale rejection while the latest search is loading", async () => {
    const first = deferred(),
      second = deferred();
    setup({
      discover: vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    });
    search();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Newer address SE" },
    });
    search();
    await act(async () => first.reject(new Error("old failure")));
    expect(screen.getByRole("status")).toBeTruthy();
    await act(async () => second.resolve(house));
    expect(accounts()).toHaveLength(1);
  });

  it("invalidates pending discovery when the municipality changes to a non-Calgary context", async () => {
    const pending = deferred();
    const { props, rerender } = setup({
      discover: vi.fn().mockReturnValue(pending.promise),
    });
    search();
    rerender(
      React.createElement(ParcelCandidatesPanel, {
        ...props,
        municipality: "Edmonton",
      })
    );
    await act(async () => pending.resolve(house));
    expect(screen.queryByRole("radio")).toBeNull();
    expect(apply().disabled).toBe(true);
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    expect(props.discover).toHaveBeenCalledTimes(1);
  });

  it("disables Search while loading and prevents a duplicate form submission", async () => {
    const pending = deferred();
    const { props } = setup({
      discover: vi.fn().mockReturnValue(pending.promise),
    });
    search();
    expect(
      (
        screen.getByRole("button", {
          name: "Search parcels",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    search();
    fireEvent.submit(screen.getByRole("textbox").closest("form")!);
    expect(props.discover).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(house));
    expect(
      (
        screen.getByRole("button", {
          name: "Search parcels",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it("names the selected municipality in the visible gate near search", () => {
    const { props } = setup({ municipality: "Edmonton" });
    const message = screen.getByRole("status");
    expect(message.textContent).toContain("Selected municipality: Edmonton.");
    expect(
      screen.getByRole("textbox").closest("form")!.nextElementSibling
    ).toBe(message);
    search();
    expect(props.discover).not.toHaveBeenCalled();
  });

  it("Use this copies the drawing address, clears previous results and does not discover until Search", async () => {
    const { props } = setup({ extractedAddress: "  Drawing address NE  " });
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    fireEvent.click(screen.getByRole("button", { name: "Use this" }));
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "  Drawing address NE  "
    );
    expect(screen.queryByRole("radio")).toBeNull();
    expect(apply().disabled).toBe(true);
    expect(props.discover).toHaveBeenCalledTimes(1);
    search();
    await screen.findAllByRole("radio");
    expect(props.discover).toHaveBeenLastCalledWith({
      address: "  Drawing address NE  ",
      municipality: "Calgary",
    });
  });

  it("remount via a changed key clears the edited address, results and all selections", async () => {
    const { props, rerender } = setup();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Edited address SE" },
    });
    await loaded();
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    fireEvent.click(apply());
    rerender(
      React.createElement(ParcelCandidatesPanel, {
        ...props,
        key: "another-project",
      })
    );
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      house.query.normalized
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(apply().disabled).toBe(true);
    // Remount itself makes no call. Only the explicit Search below does.
    expect(props.discover).toHaveBeenCalledTimes(1);
    search();
    await screen.findAllByRole("radio");
    expect(props.discover).toHaveBeenCalledTimes(2);
    expect(accounts()[0].checked).toBe(false);
    expect(parcels()[0].checked).toBe(false);
  });

  it("ticking, choosing and applying make no further discover call", async () => {
    const { props } = setup();
    await loaded();
    fireEvent.click(parcels()[0]);
    expect(props.discover).toHaveBeenCalledTimes(1);
    fireEvent.click(accounts()[0]);
    expect(props.discover).toHaveBeenCalledTimes(1);
    fireEvent.click(apply());
    expect(props.onApply).toHaveBeenCalledTimes(1);
    expect(props.discover).toHaveBeenCalledTimes(1);
  });

  it.each(["resolve", "reject"] as const)(
    "unmount during a pending request changes no state on late %s",
    async completion => {
      const pending = deferred();
      const props: ParcelCandidatesPanelProps = {
        projectAddress: house.query.normalized,
        municipality: "Calgary",
        discover: vi.fn().mockReturnValue(pending.promise),
        onApply: vi.fn(),
      };
      const onRender = vi.fn();
      const { unmount, container } = render(
        React.createElement(
          React.Profiler,
          { id: "panel", onRender },
          React.createElement(ParcelCandidatesPanel, props)
        )
      );
      search();
      unmount();
      const commits = onRender.mock.calls.length;
      await act(async () => {
        if (completion === "resolve") {
          pending.resolve(house);
          await expect(pending.promise).resolves.toBe(house);
        } else {
          const settled = expect(pending.promise).rejects.toThrow(
            "Late failure"
          );
          pending.reject(new Error("Late failure"));
          await settled;
        }
      });
      expect(container.childElementCount).toBe(0);
      expect(onRender).toHaveBeenCalledTimes(commits);
      expect(props.onApply).not.toHaveBeenCalled();
      expect(props.discover).toHaveBeenCalledTimes(1);
      // A subsequent mount cannot inherit the completed request's state.
      render(React.createElement(ParcelCandidatesPanel, props));
      expect(screen.queryByRole("radio")).toBeNull();
      expect(screen.queryByRole("status")).toBeNull();
      expect(apply().disabled).toBe(true);
    }
  );

  it("preserves interior rings with evenodd fill", async () => {
    const outer = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
    ];
    const hole = [
      [0.2, 0.2],
      [0.8, 0.2],
      [0.8, 0.8],
      [0.2, 0.2],
    ];
    const data: CandidateDiscovery = {
      ...house,
      parcels: [
        {
          ...house.parcels[0],
          geometry: { type: "MultiPolygon", coordinates: [[outer, hole]] },
        },
      ],
    };
    setup({ discover: vi.fn().mockResolvedValue(data) });
    await loaded();
    const path = screen.getByRole("img").querySelector("path")!;
    expect(path.getAttribute("fill-rule")).toBe("evenodd");
    expect(path.getAttribute("d")?.match(/M/g)).toHaveLength(2);
  });

  it("shows the exact sentence Indicative public data, not a survey.", () => {
    setup();
    expect(
      screen.getByText("Indicative public data, not a survey.", { exact: true })
        .textContent
    ).toBe("Indicative public data, not a survey.");
  });

  it("shows Not saved as its own separate label", () => {
    setup();
    const label = screen.getByText("Not saved", { exact: true });
    expect(label.tagName).toBe("SPAN");
    expect(label.textContent).toBe("Not saved");
    expect(label).not.toBe(
      screen.getByText("Indicative public data, not a survey.")
    );
  });

  it("shows Results for: address followed by roll year and formatRetrievedAt time in the header", async () => {
    // The offset instant must be rendered as UTC, rather than echoed or read from the clock.
    setup({
      discover: vi.fn().mockResolvedValue({
        ...house,
        retrievedAt: "2026-10-13T22:09:18-06:00",
      }),
    });
    await loaded();
    expect(screen.getByRole("heading", { level: 4 }).textContent).toBe(
      "Results for: 132 CORAL SHORES CA NE · Roll year: 2026 · Retrieved 2026-10-14 04:09 UTC"
    );
  });

  it("shows via shared parcel only on the shared account in a mixed pair", async () => {
    const recorded = fixture("mcdougall");
    const data: CandidateDiscovery = {
      ...recorded,
      accounts: [
        { ...recorded.accounts[0], viaSharedParcel: false },
        { ...recorded.accounts[1], viaSharedParcel: true },
      ],
    };
    setup({ discover: vi.fn().mockResolvedValue(data) });
    await loaded();
    const direct = screen.getByRole("radio", {
      name: /Account 069501468/,
    }).parentElement!;
    const shared = screen.getByRole("radio", {
      name: /Account 069501484/,
    }).parentElement!;
    expect(direct.textContent).not.toContain("via shared parcel");
    expect(shared.textContent).toContain("via shared parcel");
    expect(screen.getAllByText(/via shared parcel/)).toHaveLength(1);
  });
});

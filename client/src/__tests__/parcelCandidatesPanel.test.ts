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
      screen.getByText("Searched address: Another address SE", { exact: false })
    ).toBeTruthy();
  });

  it("shows recorded provenance, attribution and unselected account and parcel controls", async () => {
    setup();
    await loaded();
    expect(
      screen.getByText(/1 parcels · 1 accounts · 1 source rows/)
    ).toBeTruthy();
    expect(screen.getByText(/4bsw-nn7w.*2026-10-14 04:09 UTC/)).toBeTruthy();
    expect(screen.getByText(PARCEL_ATTRIBUTION, { exact: false })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Licence" }).getAttribute("href")
    ).toBe(house.source.licenceUrl);
    expect(accounts()[0].checked).toBe(false);
    expect(parcels()[0].checked).toBe(false);
    expect(apply().disabled).toBe(true);
  });

  it("renders deterministic outline paths with evenodd fill so interior rings remain holes", async () => {
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
    expect(path.getAttribute("d")).toBe(parcelOutlines(data.parcels)[0].path);
    expect(path.getAttribute("d")?.match(/M/g)).toHaveLength(2);
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
    expect(props.onApply).toHaveBeenCalledWith(
      expect.objectContaining({ areaM2: account.landSizeSqm, rollNumber: roll })
    );
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

  it("ignores an out-of-order response after the newer search has completed", async () => {
    const first = deferred(),
      second = deferred();
    const discover = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    setup({ discover });
    search();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Newer address SE" },
    });
    search();
    await act(async () => second.resolve(house));
    fireEvent.click(parcels()[0]);
    fireEvent.click(accounts()[0]);
    await act(async () => first.resolve({ status: "no_data" }));
    expect(screen.getByText("Searched address: Newer address SE")).toBeTruthy();
    expect(accounts()[0].checked).toBe(true);
    expect(apply().disabled).toBe(false);
    expect(screen.queryByText(/No parcel candidates found/)).toBeNull();
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
});

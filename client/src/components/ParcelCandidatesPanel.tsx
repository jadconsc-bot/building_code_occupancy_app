import React, { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  applyEligibility,
  formatRetrievedAt,
  formatSqm,
  getApplyPayload,
  initialParcelCandidatesState,
  isCalgary,
  OUTLINE_VIEWBOX,
  PARCEL_ATTRIBUTION,
  PARCEL_LICENCE_URL,
  PARCEL_UNAVAILABLE_MESSAGE,
  parcelCandidatesReducer,
  parcelOutlines,
  searchAddressChoice,
  type AppliedParcelArea,
  type DiscoveryReply,
} from "./parcelCandidates";

export interface ParcelCandidatesPanelProps {
  projectAddress?: string | null;
  extractedAddress?: string | null;
  municipality: string | null;
  discover: (input: {
    address: string;
    municipality: string;
  }) => Promise<DiscoveryReply>;
  onApply: (area: AppliedParcelArea) => void;
}

/** Temporary selection only; the parent decides how to use the applied area.
 * React elements also run under the existing JSX-preserving Vitest configuration. */
export function ParcelCandidatesPanel({
  projectAddress = null,
  extractedAddress = null,
  municipality,
  discover,
  onApply,
}: ParcelCandidatesPanelProps) {
  const prefill = searchAddressChoice(projectAddress, extractedAddress);
  const [address, setAddress] = useState(prefill.address);
  const [state, dispatch] = useReducer(
    parcelCandidatesReducer,
    undefined,
    initialParcelCandidatesState
  );
  const sequence = useRef(0);
  const id = useId();
  const supported = isCalgary(municipality);
  const selectedMunicipality = municipality?.trim() || "not selected";
  const gateMessage = `Parcel search is available for Calgary only. Selected municipality: ${selectedMunicipality}. Enter or confirm the lot area manually.`;

  useEffect(() => {
    setAddress(searchAddressChoice(projectAddress, extractedAddress).address);
    dispatch({ type: "reset" });
    sequence.current += 1;
    // Invalidate pending completions on context changes and unmount as well.
    return () => {
      sequence.current += 1;
    };
  }, [projectAddress, extractedAddress, municipality]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!supported || state.status === "loading" || address.trim().length < 5)
      return;
    const requestId = ++sequence.current;
    dispatch({
      type: "search",
      requestId,
      address,
      municipality: municipality!,
    });
    try {
      const response = await discover({ address, municipality: municipality! });
      if (sequence.current === requestId)
        dispatch({ type: "resolve", requestId, response });
    } catch {
      if (sequence.current === requestId)
        dispatch({ type: "reject", requestId });
    }
  }

  const eligibility = applyEligibility(state);
  const data = state.status === "ok" ? state.data : null;
  const searchMessage =
    !supported || state.status === "unsupported"
      ? gateMessage
      : state.status === "no_data"
        ? "No parcel candidates found. Enter or confirm the lot area manually."
        : state.status === "error"
          ? PARCEL_UNAVAILABLE_MESSAGE
          : null;
  const reason = !supported
    ? "Search is unavailable for the selected municipality."
    : state.status === "idle"
      ? "Search for an address, then select one assessment account."
      : state.status === "loading"
        ? "Wait for the parcel search to finish."
        : state.status === "no_data"
          ? "No results to apply. Enter or confirm the lot area manually."
          : state.status === "unsupported"
            ? "Search is unavailable for the selected municipality."
            : state.status === "error"
              ? "No results to apply. Retry the search or enter the lot area manually."
              : data?.truncated
                ? "Results are incomplete. Refine the address before applying an area."
                : (eligibility.reason ??
                  eligibility.warning ??
                  (!eligibility.allowed
                    ? "Select one assessment account and tick its parcels."
                    : null));

  return React.createElement(
    "section",
    {
      "aria-labelledby": `${id}-title`,
      className: "space-y-4 rounded-lg border p-4",
    },
    React.createElement(
      "h3",
      { id: `${id}-title`, className: "font-semibold" },
      "Parcel candidates"
    ),
    React.createElement(
      "p",
      { className: "text-sm font-medium" },
      "Indicative public data · Not saved"
    ),
    React.createElement(
      "p",
      { className: "text-sm text-muted-foreground" },
      "Review the parcels and choose one assessment account. Assessed land areas are not additive and are not measured parcel areas."
    ),
    React.createElement(
      "form",
      { onSubmit: search, className: "flex flex-wrap items-end gap-2" },
      React.createElement(
        "label",
        { className: "flex min-w-0 flex-1 flex-col gap-1" },
        "Search address",
        React.createElement("input", {
          value: address,
          className: "rounded border px-3 py-2",
          onChange: event => {
            setAddress(event.target.value);
            sequence.current += 1;
            dispatch({ type: "reset" });
          },
        })
      ),
      React.createElement(
        "button",
        {
          type: "submit",
          disabled:
            !supported ||
            state.status === "loading" ||
            address.trim().length < 5,
          className: "rounded border px-3 py-2 disabled:opacity-50",
        },
        "Search parcels"
      )
    ),
    searchMessage &&
      React.createElement(
        "p",
        { role: "status", className: "text-sm", id: `${id}-search-status` },
        searchMessage
      ),
    prefill.drawingAddress &&
      React.createElement(
        "p",
        { className: "text-sm" },
        "Drawing address differs: ",
        prefill.drawingAddress,
        ". Check which address describes this site. ",
        React.createElement(
          "button",
          {
            type: "button",
            className: "rounded border px-2 py-1",
            onClick: () => {
              setAddress(prefill.drawingAddress!);
              sequence.current += 1;
              dispatch({ type: "reset" });
            },
          },
          "Use this"
        )
      ),
    React.createElement(
      "div",
      { "aria-live": "polite", "aria-atomic": "true" },
      state.status === "loading" &&
        React.createElement(
          "p",
          { role: "status" },
          "Searching parcel candidates…"
        ),
      data &&
        supported &&
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            "p",
            { className: "text-sm" },
            "Results for ",
            state.address
          ),
          data.truncated &&
            React.createElement(
              "p",
              {
                role: "alert",
                className:
                  "rounded border border-amber-500 bg-amber-50 p-2 text-sm text-amber-950",
              },
              "Truncated results — not all candidates are shown. Refine the address before applying an area."
            ),
          React.createElement(
            "p",
            { className: "text-sm" },
            data.counts.parcels,
            " parcels · ",
            data.counts.accounts,
            " accounts · ",
            data.counts.rows,
            " source rows"
          ),
          React.createElement(
            "p",
            { className: "text-sm" },
            data.source.name,
            " (",
            data.source.dataset,
            ") · Retrieved ",
            formatRetrievedAt(data.retrievedAt)
          ),
          data.warnings.map((warning, index) =>
            React.createElement(
              "p",
              { key: index, className: "text-sm" },
              warning
            )
          ),
          React.createElement(
            "svg",
            {
              viewBox: `0 0 ${OUTLINE_VIEWBOX.width} ${OUTLINE_VIEWBOX.height}`,
              role: "img",
              "aria-label": "Parcel outlines, schematic only",
              className: "my-3 w-full max-w-sm rounded border",
            },
            parcelOutlines(data.parcels)
              .filter(outline => outline.path)
              .map(outline =>
                React.createElement(
                  "path",
                  {
                    key: outline.cpid,
                    d: outline.path,
                    fillRule: "evenodd",
                    fill: state.selectedCpids.includes(outline.cpid)
                      ? "#bfdbfe"
                      : "#f1f5f9",
                    stroke: "#334155",
                    strokeWidth: "1",
                  },
                  React.createElement("title", null, "Parcel ", outline.cpid)
                )
              ),
            React.createElement(
              "g",
              {
                "aria-label": "North arrow",
                stroke: "#334155",
                fill: "#334155",
              },
              React.createElement("title", null, "North arrow"),
              React.createElement(
                "text",
                {
                  x: 296,
                  y: 12,
                  textAnchor: "middle",
                  stroke: "none",
                  fontSize: 10,
                },
                "N"
              ),
              React.createElement("line", {
                x1: 296,
                y1: 42,
                x2: 296,
                y2: 18,
                strokeWidth: 1.5,
              }),
              React.createElement("polyline", {
                points: "291,25 296,18 301,25",
                fill: "none",
                strokeWidth: 1.5,
              })
            )
          ),
          React.createElement(
            "p",
            { className: "text-sm text-muted-foreground" },
            "Outline only, not to scale for design"
          ),
          React.createElement(
            "fieldset",
            { className: "space-y-2" },
            React.createElement(
              "legend",
              { className: "font-medium" },
              "Parcels"
            ),
            data.parcels.map(parcel =>
              React.createElement(
                "label",
                { key: parcel.cpid, className: "block text-sm" },
                React.createElement("input", {
                  type: "checkbox",
                  checked: state.selectedCpids.includes(parcel.cpid),
                  onChange: event =>
                    dispatch({
                      type: "parcel",
                      cpid: parcel.cpid,
                      checked: event.target.checked,
                    }),
                }),
                " ",
                "Parcel ",
                parcel.cpid,
                " · ",
                parcel.addresses.join("; ") || "Address unavailable",
                " · Land use: ",
                parcel.landUseDesignations.join("; ") || "unavailable",
                parcel.shortLegals.length > 0 &&
                  React.createElement(
                    React.Fragment,
                    null,
                    " · Legal: ",
                    parcel.shortLegals.join("; ")
                  ),
                !parcel.geometry &&
                  React.createElement(
                    React.Fragment,
                    null,
                    " · Boundary unavailable"
                  )
              )
            )
          ),
          React.createElement(
            "fieldset",
            { className: "mt-3 space-y-2" },
            React.createElement(
              "legend",
              { className: "font-medium" },
              "Choose one assessment account"
            ),
            data.accounts.map(account =>
              React.createElement(
                "label",
                { key: account.rollNumber, className: "block text-sm" },
                React.createElement("input", {
                  type: "radio",
                  name: `${id}-account`,
                  checked: state.selectedRollNumbers.includes(
                    account.rollNumber
                  ),
                  onChange: () =>
                    dispatch({
                      type: "account",
                      rollNumber: account.rollNumber,
                    }),
                }),
                " ",
                "Account ",
                account.rollNumber,
                " · ",
                account.address,
                " · ",
                formatSqm(account.landSizeSqm),
                " m² assessed land area · Roll year: ",
                account.rollYear ?? "unavailable",
                account.assessmentClass &&
                  React.createElement(
                    React.Fragment,
                    null,
                    " · Class: ",
                    account.assessmentClass
                  ),
                account.viaSharedParcel &&
                  React.createElement(
                    React.Fragment,
                    null,
                    " · via shared parcel"
                  )
              )
            )
          )
        )
    ),
    React.createElement(
      "div",
      { className: "flex flex-wrap items-center gap-2" },
      React.createElement(
        "button",
        {
          type: "button",
          disabled: !supported || !eligibility.allowed,
          "aria-describedby": reason ? `${id}-reason` : void 0,
          className: "rounded border px-3 py-2 disabled:opacity-50",
          onClick: () => {
            if (!supported) return;
            const payload = getApplyPayload(state);
            if (payload) onApply(payload);
          },
        },
        "Apply assessed area"
      ),
      reason &&
        React.createElement(
          "p",
          { id: `${id}-reason`, className: "text-sm" },
          reason
        )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-muted-foreground" },
      PARCEL_ATTRIBUTION,
      " ",
      React.createElement(
        "a",
        {
          href: PARCEL_LICENCE_URL,
          target: "_blank",
          rel: "noreferrer",
          className: "underline",
        },
        "Licence"
      )
    )
  );
}

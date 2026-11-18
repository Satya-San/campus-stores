(() => {
  const storageKey = "campus-stores.shift.v2";
  const themeKey = "campus-stores.theme";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // Minutes from Friday 00:00, so desk time and due times can be compared.
  const clockMin = [945, 1170, 1980];
  const dueMin = {
    "Fri 8 pm": 1200,
    "Sat 9 am": 1980,
    "Sat 10 am": 2040,
    "Sat noon": 2160,
  };
  const dueTimes = Object.keys(dueMin);
  const timeMin = {
    "Friday · 3:20 pm": 920,
    "Friday · 3:30 pm": 930,
  };
  shifts.forEach((x, i) => (timeMin[x.time] = clockMin[i]));
  const original = (mode = "proposed") => ({
    version: 2,
    mode,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
        at: "Friday · 3:30 pm",
        holder: "Tara Shah",
        expect: "Sat 10 am",
        events: [],
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    checkin: "",
    lookup: "",
    undo: null,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const v2 = () => s.mode === "proposed";
  const now = () => clockMin[s.phase];
  const stamp = () => shifts[s.phase].time;
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const holder = (l) => l.holder || l.who;
  const expect = (l) => l.expect || l.due;
  const late = (l) => !l.back && now() > dueMin[expect(l)];
  const flagged = (l) => !l.back && (holder(l) !== l.who || late(l));
  const short = (t) => t.replace(/^(\w{3})\w*day · /, "$1 ");

  // ---------- Markup helpers ----------
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const ic = (name) =>
    '<svg aria-hidden="true" class="store-icon"><use href="#icon-' +
    name +
    '"></use></svg>';
  const opts = (list, picked = "") =>
    list
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === picked ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("");
  const btn = (label, act, val = "", style = "", icon = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    (icon ? ic(icon) : "") +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2>" +
    (sub ? "<small>" + sub + "</small>" : "") +
    "</div>" +
    control +
    "</div>";
  const chip = (id) => '<span class="assettag">' + esc(id) + "</span>";
  const row = (label, sub, right, tag = "", lead = "") =>
    '<div class="row' +
    (tag || lead ? " lead" : "") +
    '">' +
    (tag ? chip(tag) : lead) +
    '<div class="cell"><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    '</small></div><div class="end">' +
    right +
    "</div></div>";
  const badge = (t, kind = false) =>
    '<span class="tag' +
    (kind === true ? " good" : kind ? " " + kind : "") +
    '"><i aria-hidden="true"></i>' +
    esc(t) +
    "</span>";
  const initials = (name) =>
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const hue = (name) =>
    [...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 6;
  const avatar = (name, square = false) =>
    '<span class="av h' +
    hue(name) +
    (square ? " sq" : "") +
    '" aria-hidden="true">' +
    esc(initials(name)) +
    "</span>";
  const person = (name, sub = "") =>
    '<span class="person">' +
    avatar(name) +
    "<span><b>" +
    esc(name) +
    "</b>" +
    (sub ? "<small>" + esc(sub) + "</small>" : "") +
    "</span></span>";
  const segtabs = (label, items, act, current) =>
    '<div class="segtabs" role="group" aria-label="' +
    label +
    '">' +
    items
      .map(
        ([v, t, n]) =>
          '<button type="button" data-action="' +
          act +
          '" data-val="' +
          esc(v) +
          '" aria-pressed="' +
          (v === current) +
          '">' +
          esc(t) +
          (n !== undefined ? '<span class="n">' + n + "</span>" : "") +
          "</button>",
      )
      .join("") +
    "</div>";
  // Where a slip stands right now, in words a counter clerk can act on.
  const loanState = (l) => {
    if (l.back)
      return badge(
        "Returned" + (l.backAt ? " " + short(l.backAt) : ""),
        "done",
      );
    if (late(l)) return badge("Overdue · was due " + expect(l), "bad");
    if (holder(l) !== l.who)
      return badge("With " + holder(l) + " · back " + expect(l), "warn");
    if (now() === dueMin[expect(l)]) return badge("Due now", "warn");
    return badge("Due " + expect(l));
  };

  // ---------- Requests ----------
  function requestPage() {
    const html = head("Requests", requests.length + " approved");
    if (s.selected) {
      const r = getReq(s.selected);
      const item = (x) => {
        const l = v2()
          ? s.loans
              .filter((l) => l.req === r.id && getAsset(l.asset).type === x)
              .pop()
          : null;
        return (
          '<li class="itemline"><span>' +
          esc(x) +
          (l ? "<small>" + l.asset + " · L-" + l.num + "</small>" : "") +
          "</span>" +
          (v2() ? (l ? loanState(l) : badge("Not issued")) : "") +
          "</li>"
        );
      };
      return (
        html +
        btn("All requests", "close", "", "ghost back", "chevron-left") +
        '<article class="card detail enter"><div class="detailhead">' +
        avatar(r.club, true) +
        '<div><span class="mono">' +
        r.id +
        " · Approved</span><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        '</p></div><div class="due"><small>Return by</small><strong>' +
        r.due +
        '</strong></div></div><div class="detailbody"><span class="label">Approved equipment</span><ul class="items">' +
        r.items.map(item).join("") +
        '</ul><p class="note">' +
        esc(r.note) +
        "</p></div></article>"
      );
    }
    return (
      html +
      '<div class="card list">' +
      requests
        .map((r) => {
          const issued = new Set(
            s.loans
              .filter((l) => l.req === r.id)
              .map((l) => getAsset(l.asset).type),
          ).size;
          return row(
            r.event,
            r.id + " · " + r.club + " · Return by " + r.due,
            (v2()
              ? '<span class="progress" title="Approved items issued"><span style="--p:' +
                issued / r.items.length +
                '"></span>' +
                issued +
                "/" +
                r.items.length +
                "</span>"
              : "") +
              btn("Open", "request", r.id, "ghost", "chevron-right"),
            "",
            avatar(r.club, true),
          );
        })
        .join("") +
      "</div>"
    );
  }

  // ---------- Inventory ----------
  function inventory() {
    const statusOf = (a) =>
      a.repair ? "In repair" : out(a.id) ? "On loan" : "On shelf";
    const counts = { "All items": assets.length };
    for (const a of assets)
      counts[statusOf(a)] = (counts[statusOf(a)] || 0) + 1;
    let html =
      head("Inventory", assets.length + " units") +
      '<div class="toolbar">' +
      segtabs(
        "Show",
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [
          f,
          f,
          counts[f] || 0,
        ]),
        "filter",
        s.filter,
      ) +
      '</div><div class="card list">';
    let shown = 0;
    for (const a of assets) {
      const l = out(a.id);
      const status = statusOf(a);
      if (s.filter !== "All items" && s.filter !== status) continue;
      shown++;
      html += row(
        a.type,
        a.model +
          " · shelf " +
          a.bin +
          (v2() && l ? " · L-" + l.num + " · with " + holder(l) : ""),
        v2() && l
          ? loanState(l)
          : badge(
              status,
              status === "On shelf" ? true : status === "In repair" ? "bad" : "warn",
            ),
        a.id,
      );
    }
    if (!shown) html += '<p class="empty">Nothing here.</p>';
    return html + "</div>";
  }

  // ---------- Issue slip (shared) ----------
  function issueForm() {
    const available = assets.filter((a) => !a.repair && !out(a.id));
    const select = (label, key, options) =>
      "<label><span>" +
      label +
      '</span><select name="' +
      key +
      '" required><option value="">Select…</option>' +
      opts(options) +
      "</select></label>";
    return (
      '<form data-issue class="card formcard enter"><div class="form">' +
      select(
        "Approved request",
        "req",
        requests.map((r) => [r.id, r.id + " · " + r.club]),
      ) +
      select(
        "Unit leaving the desk",
        "asset",
        available.map((a) => [a.id, a.id + " · " + a.type]),
      ) +
      select(
        "Collected by",
        "who",
        people.map((p) => [p, p]),
      ) +
      select(
        "Return by",
        "due",
        dueTimes.map((d) => [d, d]),
      ) +
      '</div><div class="formfoot"><div class="grow"></div><button type="submit" class="primary">Save issue slip</button></div></form>'
    );
  }

  // ---------- Loan register: original ----------
  function register() {
    if (v2()) return registerV2();
    const openCount = s.loans.filter((l) => !l.back).length;
    let html = head(
      "Loan register",
      openCount + " open",
      s.editing
        ? btn("Cancel", "cancel", "", "ghost")
        : btn("New issue slip", "new", "", "primary", "plus"),
    );
    if (s.editing) return html + issueForm();
    html +=
      '<div class="toolbar">' +
      segtabs(
        "Show slips",
        [
          ["0", "Outstanding"],
          ["1", "All slips"],
        ],
        "scope",
        s.onlyOpen ? "0" : "1",
      ) +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    html += '<div class="card list">';
    if (!shown.length) html += '<p class="empty">No outstanding slips.</p>';
    for (const l of shown)
      html += row(
        "L-" + l.num + " · " + l.asset,
        l.req + " · " + l.who + " · Due " + l.due,
        l.back
          ? badge("Returned", "done")
          : btn("Record return", "return", String(l.num)),
      );
    return html + "</div>";
  }

  // ---------- Loan register: proposed ----------
  const custody = (l) => {
    const r = getReq(l.req);
    const steps = [
      [l.at || "", "Issued to " + l.who + " for " + r.event],
      ...(l.events || []).map((e) => [e.at, e.text]),
    ];
    return (
      '<ol class="trail">' +
      steps
        .map(
          ([t, x]) =>
            "<li><time>" +
            esc(short(t)) +
            "</time><span>" +
            esc(x) +
            "</span></li>",
        )
        .join("") +
      "</ol>"
    );
  };
  function lookupPanel() {
    const html =
      '<form data-lookup class="scan"><div class="scanfield">' +
      ic("scan-line") +
      '<input name="tag" aria-label="Unit at the counter" autocomplete="off" spellcheck="false" placeholder="Scan or type the tag on the unit" value="' +
      esc(s.lookup) +
      '" /><kbd aria-hidden="true">/</kbd><button type="submit">Find slip</button></div></form>';
    if (!s.lookup) return html;
    const tag = s.lookup.trim().toUpperCase();
    const a = getAsset(tag);
    const l = a && out(a.id);
    const card = (kind, body) =>
      '<div class="card match ' +
      kind +
      ' enter" role="status">' +
      body +
      "</div>";
    if (!a)
      return (
        html +
        card(
          "bad",
          '<div class="matchhead">' +
            chip(tag) +
            "<div><h3>No unit with this tag</h3><p>Check the label on the item.</p></div>" +
            btn("Clear", "clearlookup", "", "ghost") +
            "</div>",
        )
      );
    if (!l) {
      const others = s.loans.filter(
        (x) => !x.back && getAsset(x.asset).type === a.type,
      );
      return (
        html +
        card(
          "bad",
          '<div class="matchhead">' +
            chip(a.id) +
            "<div><h3>Not on loan — don’t close anything yet</h3><p>" +
            esc(a.model) +
            (a.repair
              ? " is booked into the workshop."
              : " belongs on shelf " + a.bin + ".") +
            "</p></div>" +
            btn("Clear", "clearlookup", "", "ghost") +
            "</div>" +
            (others.length
              ? '<div class="expected"><span class="label">Expected instead</span>' +
                others
                  .map(
                    (x) =>
                      '<div class="exprow">' +
                      chip(x.asset) +
                      "<span>" +
                      esc(getAsset(x.asset).model) +
                      " · L-" +
                      x.num +
                      "</span>" +
                      person(holder(x)) +
                      "</div>",
                  )
                  .join("") +
                "</div>"
              : ""),
        )
      );
    }
    const r = getReq(l.req);
    return (
      html +
      card(
        "ok",
        '<div class="matchhead">' +
          chip(a.id) +
          "<div><h3>" +
          esc(a.type) +
          "</h3><p>" +
          esc(a.model) +
          " · shelf " +
          a.bin +
          " · L-" +
          l.num +
          " · " +
          r.id +
          " " +
          esc(r.club) +
          "</p></div>" +
          loanState(l) +
          "</div>" +
          custody(l) +
          '<form data-return data-num="' +
          l.num +
          '" class="formfoot"><label><span>Returned by</span><select name="by" required>' +
          opts(
            people.map((p) => [p, p]),
            holder(l),
          ) +
          '</select></label><div class="grow"></div>' +
          btn("Cancel", "clearlookup", "", "ghost") +
          '<button type="submit" class="primary">' +
          ic("check") +
          "Confirm return of " +
          a.id +
          "</button></form>",
      )
    );
  }
  function unitRow(l) {
    const a = getAsset(l.asset);
    const who = l.back
      ? person(l.backBy || l.who, "Returned")
      : holder(l) !== l.who
        ? person(holder(l), "Issued to " + l.who)
        : person(l.who);
    return (
      '<div class="urow">' +
      chip(a.id) +
      '<div class="cell"><strong>' +
      esc(a.type) +
      "</strong><small>" +
      esc(a.model + " · shelf " + a.bin + " · L-" + l.num) +
      '</small></div><div class="cell who">' +
      who +
      '</div><div class="end">' +
      loanState(l) +
      "</div></div>"
    );
  }
  function checkinForm(r, open) {
    const line = (l) => {
      const a = getAsset(l.asset);
      const n = l.num;
      return (
        '<fieldset class="ci"><legend class="sr">' +
        a.id +
        " " +
        esc(a.type) +
        "</legend>" +
        chip(a.id) +
        '<div class="cell"><strong>' +
        esc(a.type) +
        "</strong><small>" +
        esc(a.model + " · shelf " + a.bin) +
        '</small></div><div class="seg">' +
        '<label><input type="radio" name="st-' +
        n +
        '" value="back" checked /><span>On the counter</span></label>' +
        '<label><input type="radio" name="st-' +
        n +
        '" value="out" /><span>Still out</span></label></div>' +
        '<div class="outfields"><label><span>Who has it now</span><select name="holder-' +
        n +
        '"><option value="">Select…</option>' +
        opts(people.map((p) => [p, p])) +
        '</select></label><label><span>Promised back</span><select name="expect-' +
        n +
        '"><option value="">Select…</option>' +
        opts(
          dueTimes.filter((d) => dueMin[d] >= now()).map((d) => [d, d]),
        ) +
        "</select></label></div></fieldset>"
      );
    };
    return (
      '<form data-checkin data-req="' +
      r.id +
      '" class="checkin enter">' +
      open.map(line).join("") +
      '<div class="formfoot"><label><span>Brought back by</span><select name="by">' +
      opts(
        people.map((p) => [p, p]),
        open[0].who,
      ) +
      '</select></label><div class="grow"></div>' +
      btn("Cancel", "cancelcheckin", "", "ghost") +
      '<button type="submit" class="primary">Record check-in</button>' +
      "</div></form>"
    );
  }
  function registerV2() {
    const open = s.loans.filter((l) => !l.back).length;
    const carried = s.loans.filter(flagged);
    let html = head(
      "Loan register",
      open +
        " open" +
        (carried.length ? " · " + carried.length + " expected back" : ""),
      s.editing
        ? btn("Cancel", "cancel", "", "ghost")
        : btn("New issue slip", "new", "", "primary", "plus"),
    );
    if (s.editing) return html + issueForm();
    html += lookupPanel();
    if (carried.length && s.phase > 0 && !s.lookup)
      html +=
        '<div class="card attention"><span class="label">Expected back</span>' +
        carried
          .map(
            (l) =>
              '<div class="exprow">' +
              chip(l.asset) +
              "<span>" +
              esc(getAsset(l.asset).type) +
              "</span>" +
              (holder(l) !== l.who
                ? person(holder(l), "Promised " + expect(l))
                : badge("Overdue since " + expect(l), "bad")) +
              "</div>",
          )
          .join("") +
        "</div>";
    html +=
      '<div class="toolbar">' +
      segtabs(
        "Show slips",
        [
          ["0", "Outstanding"],
          ["1", "All slips"],
        ],
        "scope",
        s.onlyOpen ? "0" : "1",
      ) +
      "</div>";
    let any = false;
    for (const r of requests) {
      const slips = s.loans
        .filter((l) => l.req === r.id && (!s.onlyOpen || !l.back))
        .sort((a, b) => a.num - b.num);
      if (!slips.length) continue;
      any = true;
      const openSlips = slips.filter((l) => !l.back);
      const issued = new Set(
        s.loans
          .filter((l) => l.req === r.id)
          .map((l) => getAsset(l.asset).type),
      ).size;
      html +=
        '<section class="card kit"><header class="kithead">' +
        avatar(r.club, true) +
        "<div><h3>" +
        esc(r.club) +
        '</h3><small><span class="mono">' +
        r.id +
        "</span> · " +
        esc(r.event) +
        '</small></div><div class="kitmeta"><span class="progress' +
        (issued < r.items.length ? " short" : "") +
        '" title="Approved items issued"><span style="--p:' +
        issued / r.items.length +
        '"></span>' +
        issued +
        "/" +
        r.items.length +
        "</span><span>Due " +
        r.due +
        "</span></div>" +
        (s.checkin === r.id
          ? ""
          : openSlips.length
            ? btn(
                openSlips.length > 1 ? "Check in kit" : "Check in",
                "checkin",
                r.id,
              )
            : badge("All returned", true)) +
        "</header>" +
        (s.checkin === r.id
          ? checkinForm(r, openSlips)
          : slips.map(unitRow).join("")) +
        "</section>";
    }
    if (!any)
      html +=
        '<div class="card list"><p class="empty">No outstanding slips.</p></div>';
    return html;
  }

  // ---------- Desk book ----------
  function deskbook() {
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, "Counter handover", n.text]);
    if (v2())
      for (const l of s.loans)
        for (const e of l.events || [])
          entries.push([e.at, "Register · L-" + l.num, e.text, l.asset]);
    const ordered = v2()
      ? entries
          .map((e, i) => [e, i])
          .sort(
            (a, b) =>
              (timeMin[b[0][0]] ?? 0) - (timeMin[a[0][0]] ?? 0) || b[1] - a[1],
          )
          .map(([e]) => e)
      : entries.slice().reverse();
    let html = head("Desk book", entries.length + " entries");
    html +=
      '<form data-note class="card compose"><textarea name="note" rows="2" maxlength="400" required aria-label="Note for the next shift" placeholder="Note for the next shift"></textarea><div class="formfoot"><div class="grow"></div><button type="submit" class="primary">Add handover note</button></div></form>';
    html += '<ol class="feed">';
    for (const [t, author, body, asset] of ordered) {
      const [name, org] = author.split(" · ");
      const mark = asset
        ? '<span class="av sys" aria-hidden="true">' + ic("book-open") + "</span>"
        : name === "Counter handover"
          ? '<span class="av sys" aria-hidden="true">' +
            ic("messages-square") +
            "</span>"
          : avatar(name);
      html +=
        '<li class="record' +
        (asset ? " linked" : "") +
        '">' +
        mark +
        '<div class="cell"><div class="feedhead"><h3>' +
        esc(name) +
        "</h3>" +
        (org ? "<small>" + esc(org) + "</small>" : "") +
        (asset ? chip(asset) : "") +
        "<time>" +
        esc(short(t)) +
        "</time></div><p>" +
        esc(body) +
        "</p></div></li>";
    }
    return html + "</ol>";
  }

  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };

  // ---------- Theme ----------
  let theme = "";
  try {
    theme = localStorage.getItem(themeKey) || "";
  } catch {
    theme = "";
  }
  if (theme !== "light" && theme !== "dim")
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dim" : "light";
  const applyTheme = () => {
    root.dataset.theme = theme;
    document.documentElement.dataset.theme = theme;
    q('[data-action="theme"] use').setAttribute(
      "href",
      theme === "dim" ? "#icon-sun" : "#icon-moon",
    );
  };

  // ---------- Toast ----------
  let toastTimer = 0;
  let shown = { notice: null, undo: null };
  function toast(text, opt = {}) {
    const el = q("[data-status]");
    el.className = "toast" + (opt.error ? " error" : "");
    el.innerHTML =
      ic(opt.error ? "x" : "check") +
      "<span>" +
      esc(text) +
      "</span>" +
      (opt.undo
        ? '<button type="button" data-action="undo" class="undo">Undo</button>'
        : "");
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => el.classList.remove("show"),
      opt.undo ? 9000 : 4500,
    );
  }

  // ---------- Paint ----------
  let lastTab = null;
  function paint() {
    const phase = shifts[s.phase];
    root.dataset.mode = s.mode;
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    q("[data-steps]").innerHTML = shifts
      .map(
        (x, i) =>
          '<li class="' +
          (i < s.phase ? "past" : i === s.phase ? "now" : "") +
          '"' +
          (i === s.phase ? ' aria-current="step"' : "") +
          '><span class="dot">' +
          (i < s.phase ? ic("check") : "") +
          "</span><div><strong>" +
          esc(x.title) +
          "</strong><small>" +
          esc(short(x.time)) +
          "</small></div></li>",
      )
      .join("");
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.innerHTML = phase.next ? esc(phase.next) + ic("arrow-right") : "";
    for (const b of root.querySelectorAll('[data-action="mode"]'))
      b.setAttribute("aria-pressed", String(b.dataset.val === s.mode));
    const attention = v2() ? s.loans.filter(flagged).length : 0;
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon], i) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '">' +
          ic(icon) +
          "<span>" +
          n +
          "</span>" +
          (n === "Loan register" && attention
            ? '<span class="count" aria-label="' +
              attention +
              ' need attention">' +
              attention +
              "</span>"
            : '<kbd aria-hidden="true">' + (i + 1) + "</kbd>") +
          "</button>",
      )
      .join("");
    // Animate only when the tab changes, not on every repaint.
    const page = q("[data-page]");
    page.classList.remove("enter");
    page.innerHTML = screens[s.tab]();
    if (lastTab !== s.tab) {
      void page.offsetWidth;
      page.classList.add("enter");
      lastTab = s.tab;
    }
    if (shown.notice !== s.notice || shown.undo !== s.undo) {
      if (shown.notice !== null) toast(s.notice, { undo: v2() && !!s.undo });
      shown = { notice: s.notice, undo: s.undo };
    }
  }
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      toast("Browser storage is unavailable. Progress lasts for this visit.", {
        error: true,
      });
    }
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    save();
  }
  const snapshot = (notice) => ({
    loans: JSON.parse(JSON.stringify(s.loans)),
    notice,
  });
  function closeLoan(l, by) {
    l.back = true;
    l.backAt = stamp();
    l.backBy = by;
    if (holder(l) !== l.who || by !== l.who)
      (l.events ||= []).push({
        at: stamp(),
        text: "Returned by " + by + ". Slip closed.",
      });
  }

  // ---------- Events ----------
  root.addEventListener("click", (e) => {
    const dialog = q("[data-brief]");
    if (e.target === dialog) return dialog.close();
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "brief":
        return dialog.showModal();
      case "closebrief":
        return dialog.close();
      case "theme":
        theme = theme === "dim" ? "light" : "dim";
        try {
          localStorage.setItem(themeKey, theme);
        } catch {
          // The theme still switches for this visit.
        }
        return applyTheme();
      case "restart":
        s = original(s.mode);
        s.notice = "Sample shift restored.";
        break;
      case "mode":
        if (s.mode === v) return;
        s.mode = v;
        s.checkin = "";
        s.lookup = "";
        s.undo = null;
        s.notice =
          v === "proposed"
            ? "Proposed desk · same records"
            : "Original desk · same records";
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.checkin = "";
        s.lookup = "";
        s.undo = null;
        s.notice = "Desk time is now " + shifts[s.phase].time + ".";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.checkin = "";
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        s.checkin = "";
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "filter":
        s.filter = v;
        break;
      case "checkin":
        s.checkin = v;
        s.lookup = "";
        break;
      case "cancelcheckin":
        s.checkin = "";
        break;
      case "clearlookup":
        s.lookup = "";
        break;
      case "undo":
        if (!s.undo) return;
        s.loans = s.undo.loans;
        s.undo = null;
        s.notice = "Undone.";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        l.back = true;
        s.notice = l.asset + " returned to stock. Slip L-" + l.num + " closed.";
        break;
      }
    }
    commit();
  });
  document.addEventListener("keydown", (e) => {
    if (q("[data-brief]").open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape" && s.lookup) {
      s.lookup = "";
      return commit();
    }
    if (e.target.closest("input, textarea, select")) return;
    const field = q("[data-lookup] input");
    if (e.key === "/" && field) {
      e.preventDefault();
      field.focus();
    } else if (/^[1-4]$/.test(e.key)) {
      s.tab = pages[Number(e.key) - 1][0];
      s.editing = false;
      s.checkin = "";
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-lookup]")) {
      s.lookup = String(form.get("tag") || "").trim();
      commit();
      const go = q("[data-return] button[type=submit]");
      (go || q("[data-lookup] input")).focus();
      return;
    }
    if (f.matches("[data-return]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.num));
      const by = String(form.get("by"));
      if (!l || l.back || !people.includes(by)) return;
      s.undo = snapshot(s.notice);
      closeLoan(l, by);
      s.lookup = "";
      const r = getReq(l.req);
      const left = s.loans.filter((x) => x.req === r.id && !x.back).length;
      commit(
        l.asset +
          " back from " +
          by +
          ". Slip L-" +
          l.num +
          " closed" +
          (left ? "." : " — " + r.id + " is fully returned.") +
          " Put it in bin " +
          getAsset(l.asset).bin +
          ".",
      );
      return;
    }
    if (f.matches("[data-checkin]")) {
      const open = s.loans.filter((l) => l.req === f.dataset.req && !l.back);
      const by = String(form.get("by"));
      const plan = open.map((l) => ({
        l,
        st: form.get("st-" + l.num),
        h: String(form.get("holder-" + l.num) || ""),
        x: String(form.get("expect-" + l.num) || ""),
      }));
      const bad = plan.find((p) => p.st === "out" && (!p.h || !p.x));
      if (bad) {
        // Show the problem in place; repainting would wipe the clerk's choices.
        let msg = f.querySelector(".inline-error");
        if (!msg) {
          msg = document.createElement("p");
          msg.className = "inline-error";
          msg.setAttribute("role", "alert");
          f.querySelector(":scope > .formfoot").append(msg);
        }
        msg.textContent =
          "For " +
          bad.l.asset +
          ", say who has it now and when it is promised back, so the next shift can chase it.";
        f.querySelector(
          '[name="' + (bad.h ? "expect-" : "holder-") + bad.l.num + '"]',
        ).focus();
        return;
      }
      s.undo = snapshot(s.notice);
      const back = [],
        still = [];
      for (const p of plan) {
        if (p.st === "back") {
          closeLoan(p.l, by);
          back.push(p.l.asset);
        } else {
          p.l.holder = p.h;
          p.l.expect = p.x;
          (p.l.events ||= []).push({
            at: stamp(),
            text:
              "Still out at check-in. " +
              by +
              " says " +
              p.h +
              " has it and will bring it back " +
              p.x +
              ".",
          });
          still.push(p.l.asset + " with " + p.h + " (" + p.x + ")");
        }
      }
      s.checkin = "";
      commit(
        (back.length ? "Checked in " + back.join(", ") + ". " : "") +
          (still.length
            ? "Still out: " +
              still.join(", ") +
              " — on the slip for the next shift."
            : "Kit fully returned."),
      );
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      toast(
        "This equipment type is outside the approved request. Choose an approved unit.",
        { error: true },
      );
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      toast("The approved quantity of this equipment type is already on loan.", {
        error: true,
      });
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    s.loans.push({
      num,
      req,
      asset,
      who,
      due,
      back: false,
      at: stamp(),
      holder: who,
      expect: due,
      events: [],
    });
    s.editing = false;
    s.undo = null;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 2 ||
      !["original", "proposed"].includes(d.mode) ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          (!l.expect || Object.hasOwn(dueMin, l.expect)) &&
          (!l.events || Array.isArray(l.events)),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      checkin: "",
      lookup: "",
      loans: d.loans.map((l) => ({ ...l, events: [...(l.events || [])] })),
      notes: d.notes.map((n) => ({ ...n })),
    };
    shown = { notice: s.notice, undo: s.undo };
    paint();
  }
  applyTheme();
  paint();
  shown = { notice: s.notice, undo: s.undo };
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();

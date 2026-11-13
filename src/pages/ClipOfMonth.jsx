import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ClipMonthVoting from "../components/ClipMonthVoting";

/** Той самий стиль, що кнопка «Кліп місяця» в наві — салатовий */
const submitClipLinkClass =
  "inline-flex items-center align-baseline px-2.5 py-1 text-xs font-bold text-white " +
  "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 " +
  "hover:from-emerald-400 hover:to-teal-500 " +
  "border border-[var(--vc-line)]  " +
  "transition-all duration-200 hover: hover:-translate-y-px " +
  "no-underline mx-0.5";

/** Суми призів у картці «Результати» — трохи яскравіше за основний текст */
const prizeMoneyClass =
  "text-[var(--vc-accent)] font-semibold tabular-nums drop-";

const stepBadgeClass = "from-emerald-500 to-teal-600";
const TELEGRAM_URL = "https://t.me/vamooschannel";
const YOUTUBE_URL = "https://www.youtube.com/@vamoosnarizky";

const contestCtaBtnClass =
  "inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white no-underline " +
  "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 " +
  "border border-[var(--vc-line)]  " +
  "transition-all duration-200 hover:-translate-y-px hover:";

const contestCtaBtnGhostClass =
  "inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-[var(--vc-accent)] no-underline " +
  "bg-white/[0.03] hover:bg-white/[0.06] border border-[var(--vc-line)] " +
  " transition-all duration-200 hover:-translate-y-px";

/**
 * Тур: з 1-го по останній день місяця — подача → голосування за попередній місяць
 * (паралельно збір на новий) → після голосування одразу знову етап подачі.
 */
const CONTEST_YEAR = new Date().getFullYear();

const MONTHS_GENITIVE_UK = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

const MONTHS_NOMINATIVE_UK = [
  "січень",
  "лютий",
  "березень",
  "квітень",
  "травень",
  "червень",
  "липень",
  "серпень",
  "вересень",
  "жовтень",
  "листопад",
  "грудень",
];

/** Розклад відносно поточного місяця: подача зараз, голосування 1-6 наступного. */
function getContestSchedule(year = CONTEST_YEAR, baseMonth = new Date().getMonth()) {
  return {
    submitStart: new Date(year, baseMonth, 1, 0, 0, 0, 0),
    submitEnd: new Date(year, baseMonth + 1, 0, 23, 59, 59, 999),
    voteStart: new Date(year, baseMonth + 1, 1, 0, 0, 0, 0),
    voteEnd: new Date(year, baseMonth + 1, 6, 23, 59, 59, 999),
  };
}

function dayMonthGenitiveUk(d, includeYear = true) {
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  const yPart = includeYear ? ` ${y}` : "";
  return `${day} ${MONTHS_GENITIVE_UK[m]}${yPart}`;
}

function formatVoteRangeUk(schedule) {
  const d1 = schedule.voteStart;
  const d2 = schedule.voteEnd;
  const m1 = d1.getMonth();
  const m2 = d2.getMonth();
  const y = d2.getFullYear();
  if (m1 === m2) {
    return `з ${d1.getDate()} по ${d2.getDate()} ${MONTHS_GENITIVE_UK[m2]} ${y}`;
  }
  return `з ${dayMonthGenitiveUk(d1)} по ${dayMonthGenitiveUk(d2)}`;
}

/** Місяць подачі (фіналісти) род. відмінок + місяць паралельної подачі називний. */
function getParallelMonthLabels(schedule) {
  const subM = schedule.submitEnd.getMonth();
  const voteM = schedule.voteStart.getMonth();
  return {
    finalistsMonthGenitive: MONTHS_GENITIVE_UK[subM],
    newTourMonthNominative: MONTHS_NOMINATIVE_UK[voteM],
  };
}

/**
 * Прев’ю без прив’язки до календаря: показати конкретну фазу.
 * null — рахувати фазу за датами туру нижче.
 * @type {null | "upcoming" | "submission" | "voting" | "idle"}
 */
const PREVIEW_PHASE = null;

/** Голосування: з 1 по 6 кожного місяця (за фіналістів попереднього туру). */
function isClipMonthVotingDays(now = new Date()) {
  const day = now.getDate();
  return day >= 1 && day <= 6;
}

/** Розклад для статусу / підписів: у дні 1–6 — тур попереднього місяця. */
function getActiveContestSchedule(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (isClipMonthVotingDays(now)) {
    if (m === 0) return getContestSchedule(y - 1, 11);
    return getContestSchedule(y, m - 1);
  }
  return getContestSchedule(y, m);
}

function getContestPhase(now = new Date()) {
  const y = CONTEST_YEAR;
  if (PREVIEW_PHASE) {
    return { kind: PREVIEW_PHASE, year: y };
  }
  const s = getContestSchedule(y, now.getMonth());
  if (now < s.submitStart) {
    return { kind: "upcoming", year: y };
  }
  if (isClipMonthVotingDays(now)) {
    return { kind: "voting", year: y };
  }
  if (now <= s.submitEnd) {
    return { kind: "submission", year: y };
  }
  if (now >= s.voteStart && now <= s.voteEnd) {
    return { kind: "voting", year: y };
  }
  return { kind: "submission", year: y };
}

function WaitingDots() {
  return (
    <span
      className="inline-flex gap-1.5 ml-1 align-middle translate-y-[-2px]"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 bg-[var(--vc-accent)] clip-month-status__dot"
        />
      ))}
    </span>
  );
}

/** Під час голосування за попередній місяць — нагадування про вже відкриту подачу за новий. */
function ParallelSubmissionDuringVoting({
  finalistsMonthGenitive,
  newTourMonthNominative,
}) {
  return (
    <div
      className={
        "mt-5 border border-[var(--vc-line)] bg-[var(--vc-bg)] " +
        "p-5 text-left border border-[var(--vc-line)] "
      }
    >
      <p className="text-[var(--vc-accent)] text-xs font-semibold uppercase tracking-wide">
        Паралельно відкритий збір
      </p>
      <p className="text-white text-base font-semibold mt-2 leading-snug">
        Поки триває голосування за фіналістів{" "}
        <span className="text-[var(--vc-accent)]">{finalistsMonthGenitive}</span>, уже
        можна надсилати кліпи на конкурс{" "}
        <span className="text-[var(--vc-accent)]">{newTourMonthNominative}</span>.
      </p>
      <p className="text-[var(--vc-muted)] text-sm mt-2 leading-relaxed">
        Не треба чекати кінця голосування: окремий збір саме за новий календарний місяць туру триває.
      </p>
      <div className="mt-4">
        <Link
          to="/submit"
          className={
            "inline-flex items-center px-4 py-2.5 text-sm font-bold text-white " +
            "bg-[var(--vc-accent)] text-[var(--vc-bg)] hover:brightness-110 " +
            "border border-[var(--vc-line)]  " +
            "transition-all hover: hover:-translate-y-px no-underline"
          }
        >
          Додати кліп за {newTourMonthNominative} →
        </Link>
      </div>
    </div>
  );
}

function ContestStatus() {
  const now = new Date();
  const phase = getContestPhase(now);
  const schedule = getActiveContestSchedule(now);
  const parallel = getParallelMonthLabels(schedule);

  const wrap = (children, pulse = true) => (
    <div
      className={
        " bg-[var(--vc-bg)] border border-[var(--vc-line)] p-6 md:p-7 " +
        (pulse ? "clip-month-status--pulse" : "")
      }
    >
      {children}
    </div>
  );

  if (phase.kind === "upcoming") {
    return wrap(
      <>
        <p className="text-[var(--vc-accent)] text-xs font-semibold uppercase tracking-wide mb-2">
          Незабаром
        </p>
        <p className="text-white text-lg font-semibold">
          Перший тур «Кліп місяця» стартує{" "}
          <span className="text-[var(--vc-accent)]">
            {dayMonthGenitiveUk(schedule.submitStart)}
          </span>
          .
        </p>
        <p className="text-[var(--vc-muted)] mt-2 text-sm leading-relaxed">
          Тут з’явиться актуальний статус: збір кліпів, відбір, голосування та
          результати.
        </p>
      </>,
      false
    );
  }

  if (phase.kind === "submission") {
    return wrap(
      <>
        <p className="text-[var(--vc-accent)] text-xs font-semibold uppercase tracking-wide mb-2">
          Зараз: збір кліпів
        </p>
        <>
          <p className="text-white text-lg font-semibold leading-snug">
            Приймаємо кліпи до{" "}
            <span className="text-[var(--vc-accent)]">
              {dayMonthGenitiveUk(schedule.submitEnd, false)}
            </span>
            {" "}
            <WaitingDots />
          </p>
          <p className="text-[#c9c9c5] mt-4 leading-relaxed">
            Наразі дивимось ваші кліпи й відбираємо — зачекай{" "}
            <span className="text-[var(--vc-accent)] font-medium">кінця місяця</span>: після{" "}
            {dayMonthGenitiveUk(schedule.submitEnd, false)} сформуємо шортлист і
            відкриємо голосування{" "}
            <span className="text-white/95">
              з {schedule.voteStart.getDate()} по {schedule.voteEnd.getDate()}{" "}
              {MONTHS_GENITIVE_UK[schedule.voteEnd.getMonth()]}
            </span>.
          </p>
        </>
      </>,
      true
    );
  }

  if (phase.kind === "voting") {
    return wrap(
      <>
        <p className="text-[var(--vc-accent)] text-xs font-semibold uppercase tracking-wide mb-2">
          Зараз: голосування
        </p>
        <p className="text-white text-lg font-semibold leading-snug">
          Обери улюблений кліп серед фіналістів — до{" "}
          <span className="text-[var(--vc-accent)]">
            {dayMonthGenitiveUk(schedule.voteEnd, false)}
          </span>{" "}
          <WaitingDots />
        </p>
        <p className="text-[var(--vc-muted)] mt-3 text-sm">
          Нижче на сторінці — список фіналістів і кнопка голосу (потрібен вхід через
          Twitch). Один акаунт — один голос за тур, без повторного голосування.
        </p>
        <ParallelSubmissionDuringVoting
          finalistsMonthGenitive={parallel.finalistsMonthGenitive}
          newTourMonthNominative={parallel.newTourMonthNominative}
        />
      </>,
      true
    );
  }

  return wrap(
    <>
      <p className="text-[#c9c9c5] text-lg font-semibold">
        Наступний тур «Кліп місяця» — анонс на каналі
      </p>
      <p className="text-[var(--vc-muted)] mt-2 text-sm">
        Коли відкриємо новий збір, тут знову з’явиться статус.
      </p>
    </>,
    false
  );
}

function getSubmissionStepRange() {
  return "1 — останній день місяця";
}

function getResultsStepRange(schedule) {
  return `6 ${MONTHS_GENITIVE_UK[schedule.voteEnd.getMonth()]}`;
}

export default function ClipOfMonth() {
  const phase = getContestPhase(new Date());
  const schedule = getContestSchedule(CONTEST_YEAR);

  const steps = [
    {
      title: "Подача кліпів",
      range: getSubmissionStepRange(),
      body: (
        <>
          <p>
            Надішли свій Twitch-кліп через форму на сайті.
          </p>
          <div className="mt-4">
            <Link to="/submit" className={submitClipLinkClass}>
              Додати кліп
            </Link>
          </div>
        </>
      ),
    },
    {
      title: "Відбір фіналістів",
      range: "після закриття подачі",
      body:
        "Команда обирає до 10 кліпів у фінальне голосування.",
    },
    {
      title: "Голосування",
      range: "з 1 по 6 кожного місяця",
      body: (
        <>
          <p>
            Глядачі голосують за фіналістів. У цей самий період на сайті вже
            відкрита нова подача кліпів.
          </p>
        </>
      ),
    },
    {
      title: "Результати",
      range: getResultsStepRange(schedule),
      body: (
        <>
          <p>
            Рейтинг і переможці — <strong>кожного 6 числа</strong>{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--vc-accent)] font-medium hover:text-[var(--vc-accent)] underline underline-offset-2"
            >
              у нашому Telegram
            </a>
            .
          </p>
          <p>
            Призи: 1 місце — <span className={prizeMoneyClass}>1000 ₴</span>, 2 місце —{" "}
            <span className={prizeMoneyClass}>500 ₴</span>, 3 місце —{" "}
            <span className={prizeMoneyClass}>500 ₴</span>.
          </p>
          <p>
            Грошовий приз отримує той, хто надіслав кліп, що потрапив у топ-3.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="vc-root">
      <section className="pt-16 pb-12 px-4 text-center max-w-3xl mx-auto">
        <p className="text-[var(--vc-accent)] text-sm font-semibold tracking-wide uppercase mb-2">
          Щомісячний конкурс
        </p>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--vc-fg)] vc-display uppercase tracking-[-0.03em]">
          Кліп місяця
        </h1>
        <p className="text-[var(--vc-muted)] text-lg">
          Один цикл — подача, відбір, голосування й фінал. Нижче коротко, як це
          виглядатиме.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((s, i) => (
          <article
            key={s.title}
            className=" bg-[#151515] border border-[var(--vc-line)] p-6 md:p-8 h-full"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center   ${stepBadgeClass} text-lg font-bold text-white `}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="text-left min-w-0">
                <h2 className="text-xl font-semibold text-white">{s.title}</h2>
                <p className="text-[var(--vc-accent)] font-semibold text-sm mt-1 whitespace-nowrap">
                  {s.range}
                </p>
                <div className="text-[var(--vc-muted)] mt-3 leading-relaxed text-[15px] space-y-2 [&_p+p]:mt-0">
                  {typeof s.body === "string" ? <p>{s.body}</p> : s.body}
                </div>
              </div>
            </div>
          </article>
        ))}

        <div className="md:col-span-2 mt-2">
          <ContestStatus />
        </div>

        {phase.kind === "voting" && (
          <div className="md:col-span-2 mt-8">
            <ClipMonthVoting />
          </div>
        )}

        <div className="md:col-span-2 mt-4">
          <div className="relative overflow-hidden border border-[var(--vc-line)] bg-[var(--vc-bg)] p-6 md:p-8 text-center ">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 bg-[#151515] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-10 h-48 w-48 bg-teal-500/10 blur-3xl" />
            <p className="relative inline-flex items-center border border-[var(--vc-line)] bg-[#151515] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--vc-accent)]">
              Конкурсний хаб
            </p>
            <h3 className="relative mt-3 text-2xl md:text-3xl font-extrabold text-white">
              Слідкуй за оновленнями і подавай кліпи
            </h3>
            <p className="relative mt-3 text-[#c9c9c5] max-w-3xl mx-auto leading-relaxed">
              Переходь на наші канали, щоб не пропускати новини конкурсу, та
              надсилай свій кліп у форму подачі.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noreferrer"
                className={contestCtaBtnGhostClass}
              >
                YouTube
              </a>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className={contestCtaBtnGhostClass}
              >
                Telegram
              </a>
              <Link to="/submit" className={contestCtaBtnClass}>
                Кинути кліп
              </Link>
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}

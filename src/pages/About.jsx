import { useState } from "react";
import Footer from "../components/Footer";
import nasty from "../assets/img/nasty.jpg";
import nosochek from "../assets/img/nosochek.jpg";
import vamoos from "../assets/img/vamoos.jpg";
import sashko from "../assets/img/sashko.jpg";
import train from "../assets/img/train.png";
import taras from "../assets/img/taras.jpg"

export default function About() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("themainview@gmail.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Не вдалося скопіювати:", err);
    }
  };

  const team = [
    {
      name: "Vamoos",
      role: "Контент-менеджер, розробник, дизайнер, адміністратор",
      desc: "Займаюсь всім по трошку, але починав саме з ідей та контенту.",
      image: vamoos,
      link: "https://www.twitch.tv/vammmosss",
    },
    {
      name: "Носочек Шкарпеткович",
      role: "Помічник по всьому",
      desc: "Цю людину можна попросити про все, що завгодно. Він завжди допоможе!",
      image: nosochek,
      link: "https://www.twitch.tv/nosochokshkarpetkovychuwu",
    },
    {
      name: "Nasty Cringe",
      role: "Монтажер, редактор, стрімер",
      desc: "Монтує кліпи, допомагає з редагуванням та активно стрімить на Twitch.",
      image: nasty,
      link: "https://www.twitch.tv/nasty_cringe",
    },
    {
      name: "Сашко",
      role: "Монтажер, графік, стрімер",
      desc: "Всі превю зроблені Сашком і все що ви бачите 3D то це він зробив.",
      image: sashko,
      link: "https://www.twitch.tv/dvisosiski",
      artstationlink: "https://www.artstation.com/sshtskk"
    },
    {
      name: "Максим Потяг",
      role: "Шукач гарного контенту і реклами",
      desc: "Шукає і відбирає кліпи і допомогає з вирішенням питань з рекламою.",
      image: train,
      link: "",
    },
    {
      name: "Culfich",
      role: "Монтажер, стрімер",
      desc: "Монтує шортcи і тіктоки для нашого каналу та й інколи підрубає стріми",
      image: taras,
      link: "https://www.twitch.tv/culfich",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative">
      <section className="py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Про нас</h1>
        <p className="text-gray-400">
          Наша мета — зробити зручний майданчик для обміну кліпами та переглядом
          цікавого українського контенту.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 max-w-6xl mx-auto">
        {team.map((person, i) => (
          <div
            key={i}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transition"
          >
            <div className="w-24 h-24 rounded-full bg-gray-600 mx-auto mb-4">
              <img
                src={person.image}
                alt={person.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <h2 className="text-xl font-semibold">{person.name}</h2>
            <p className="text-indigo-400">{person.role}</p>
            <p className="text-gray-400 mt-2">{person.desc}</p>
            <div className="flex justify-center gap-4">
            {person.link !== "" && (
              <a
                href={person.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mt-3 justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M4 2L2 6v14h6v2h4l2-2h4l4-4V2H4zm16 12l-2 2h-6l-2 2v-2H6V4h14v10z" />
                  <path d="M14 6h2v5h-2zm-4 0h2v5h-2z" />
                </svg>
                {person.name}
              </a>
            )}
            {person.name === "Сашко" && (
              <a
                href={person.artstationlink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-200 mt-3 justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 21.5c-5.238 0-9.5-4.262-9.5-9.5S6.762 2.5 12 2.5 21.5 6.762 21.5 12 17.238 21.5 12 21.5z"/>
                  <path d="M8.5 7.5h7v9h-7v-9zm1.5 1.5v6h4V9h-4zm1.5 1.5h1v3h-1v-3z"/>
                  <path d="M12 6.5L9.5 9.5h5L12 6.5z"/>
                </svg>
                Artstation
              </a>
            )}
            </div>

          </div>
        ))}
      </section>

      <section className="py-20 px-8 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Хочеш співпрацювати?</h2>
        <p className="text-gray-400 mb-8">
          Якщо маєш питання або ідеї — напиши нам у зручний спосіб:
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <a
            href="https://t.me/vamoosmax"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            📢 Telegram
          </a>

          <button
            onClick={handleCopy}
            className="relative px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            ✉️ Email
            {copied && (
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 bg-green-600 text-white w-full text-sm px-2 py-2 rounded-lg shadow-lg">
                Скопійовано✅
              </span>
            )}
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

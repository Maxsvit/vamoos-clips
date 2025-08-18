import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function RulesAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#1b0b28] rounded-2xl shadow-lg text-white p-4 max-w-2xl mx-auto">
      <button
        onClick={() => setOpen(!open)}
        className="flex justify-between items-center w-full text-left"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          📜 Умови відбору кліпів
        </h2>
        <ChevronDown
          className={`w-6 h-6 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ${
          open ? "max-h-[500px] mt-3" : "max-h-0"
        }`}
      >
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-green-400">🟢 Дозволено:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Україномовний контент (стрім і чат українською).</li>
              <li>Кліпи, зроблені протягом останніх 48 годин.</li>
              <li>Будь-які моменти без казино чи азартних ігор.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-red-400">🔴 Не допускається:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Російськомовний контент.</li>
              <li>Підписки чи колаби з російськими стрімерами.</li>
              <li>Будь-яка підтримка або реклама російської аудиторії.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400 italic">
            Надсилаючи кліп, ти підтверджуєш, що погоджуєшся з цими правилами.
            Порушення може призвести до відхилення майбутніх кліпів.
          </p>
        </div>
      </div>
    </div>
  );
}

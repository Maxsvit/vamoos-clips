import { useEffect, useState } from "react";
import code from "../assets/img/qr-code.jpg"

const VOTE_API_URL = "/api/streamer-awards";
const VOTER_TOKEN_KEY = "vamoos_awards_voter_id";
const HAS_VOTED_KEY = "vamoos_awards_has_voted";

const VOTING_DEADLINE = "2025-12-31T21:00:00+02:00";
const VOTING_DEADLINE_DISPLAY = "31.12.2025";

const STREAMERKA_OF_THE_YEAR_NOMINEES = [
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "veron_khalepa", name: "veron_khalepa", nickname: "veron_khalepa", login: "veron_khalepa" },
  { id: "calypsopaw", name: "calypsopaw", nickname: "calypsopaw", login: "calypsopaw" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "nyavka", name: "nyavka", nickname: "nyavka", login: "nyavka" },
  { id: "riomyri", name: "riomyri", nickname: "riomyri", login: "riomyri" },
  { id: "maryashik", name: "maryashik", nickname: "maryashik", login: "maryashik" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" },
  { id: "moonosya", name: "moonosya", nickname: "moonosya", login: "moonosya" },
  { id: "sheisfoxy", name: "sheisfoxy", nickname: "sheisfoxy", login: "sheisfoxy" },
  { id: "totoykaa", name: "totoykaa", nickname: "totoykaa", login: "totoykaa" },
  { id: "qwertyrra", name: "qwertyrra", nickname: "qwertyrra", login: "qwertyrra" },
  { id: "my_pivnich", name: "my_pivnich", nickname: "my_pivnich", login: "my_pivnich" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "akyulia", name: "akyulia", nickname: "akyulia", login: "akyulia" },
  { id: "sonialimm", name: "sonialimm", nickname: "sonialimm", login: "sonialimm" },
  { id: "lidusik_more", name: "lidusik_more", nickname: "lidusik_more", login: "lidusik_more" },
  { id: "alinariuk", name: "alinariuk", nickname: "alinariuk", login: "alinariuk" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "thejulles", name: "thejulles", nickname: "thejulles", login: "thejulles" },
  { id: "alex_lova", name: "alex_lova", nickname: "alex_lova", login: "alex_lova" },
  { id: "dobra_divka", name: "Dobra_Divka", nickname: "dobra_divka", login: "dobra_divka" },
  { id: "recooniii", name: "recooniii", nickname: "recooniii", login: "recooniii" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "maaaaarriiiii", name: "maaaaarriiiii", nickname: "maaaaarriiiii", login: "maaaaarriiiii" },
  { id: "nerzhaviyka", name: "nerzhaviyka", nickname: "nerzhaviyka", login: "nerzhaviyka" },
  { id: "pankraatik", name: "pankraatik", nickname: "pankraatik", login: "pankraatik" },
  { id: "kuzhel_", name: "kuzhel_", nickname: "kuzhel_", login: "kuzhel_" },
  { id: "verholaa", name: "verholaa", nickname: "verholaa", login: "verholaa" },
  { id: "nasty_cringe", name: "nasty_cringe", nickname: "nasty_cringe", login: "nasty_cringe" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
  { id: "zmiu_shka", name: "zmiu_shka", nickname: "zmiu_shka", login: "zmiu_shka" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "itismirai", name: "itismirai", nickname: "itismirai", login: "itismirai" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "sss0li", name: "sss0li", nickname: "sss0li", login: "sss0li" },
  { id: "pixie_itsme", name: "pixie_itsme", nickname: "pixie_itsme", login: "pixie_itsme" },
  { id: "nastya_patsiuk", name: "nastya_patsiuk", nickname: "nastya_patsiuk", login: "nastya_patsiuk" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "solodana", name: "solodana", nickname: "solodana", login: "solodana" },
  { id: "roki_sid", name: "roki_sid", nickname: "roki_sid", login: "roki_sid" },
  { id: "oryblabla", name: "oryblabla", nickname: "oryblabla", login: "oryblabla" },
  { id: "adult_woman", name: "adult_woman", nickname: "adult_woman", login: "adult_woman" },
  { id: "depressedcatss", name: "depressedcatss", nickname: "depressedcatss", login: "depressedcatss" },
  { id: "dramacat", name: "dramacat", nickname: "dramacat", login: "dramacat" },
  { id: "grudnevaaa", name: "grudnevaaa", nickname: "grudnevaaa", login: "grudnevaaa" },
  { id: "evil_kaya", name: "evil_kaya", nickname: "evil_kaya", login: "evil_kaya" },
  { id: "aaavrora", name: "aaavrora", nickname: "aaavrora", login: "aaavrora" },
  { id: "dasha_hahaa", name: "dasha_hahaa", nickname: "dasha_hahaa", login: "dasha_hahaa" },
  { id: "bar_cy4ok", name: "bar_cy4ok", nickname: "bar_cy4ok", login: "bar_cy4ok" },
  { id: "aloriwinderer", name: "aloriwinderer", nickname: "aloriwinderer", login: "aloriwinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "helliaska", name: "helliaska", nickname: "helliaska", login: "helliaska" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "lodianyk", name: "lodianyk", nickname: "lodianyk", login: "lodianyk" },
  { id: "yunvi_", name: "yunvi_", nickname: "yunvi_", login: "yunvi_" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "NeTaneToy", name: "NeTaneToy", nickname: "NeTaneToy", login: "NeTaneToy" },
  { id: "nata_riya", name: "nata_riya", nickname: "nata_riya", login: "nata_riya" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "sweetlyvii", name: "sweetlyvii", nickname: "sweetlyvii", login: "sweetlyvii" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "lizetkaa", name: "lizetkaa", nickname: "lizetkaa", login: "lizetkaa" },
  { id: "deko6", name: "deko6", nickname: "deko6", login: "deko6" }
];

const DEBUT_OF_THE_YEAR_NOMINEES = [
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "Tse_Jenya_i_Anya", name: "Tse_Jenya_i_Anya", nickname: "Tse_Jenya_i_Anya", login: "Tse_Jenya_i_Anya" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "Olejandrooo", name: "Olejandrooo", nickname: "Olejandrooo", login: "Olejandrooo" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "Volynyatko", name: "Volynyatko", nickname: "Volynyatko", login: "Volynyatko" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "Kavalets", name: "Kavalets", nickname: "Kavalets", login: "Kavalets" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "Pixie_itsme", name: "Pixie_itsme", nickname: "Pixie_itsme", login: "Pixie_itsme" },
  { id: "meawkalo", name: "meawkalo", nickname: "meawkalo", login: "meawkalo" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
];

const IRL_OF_THE_YEAR_NOMINEES = [
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "blancooww", name: "blancooww", nickname: "blancooww", login: "blancooww" },
  { id: "roolex9", name: "roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "karus1k", name: "karus1k", nickname: "karus1k", login: "karus1k" },
  { id: "bilyiiii", name: "bilyiiii", nickname: "bilyiiii", login: "bilyiiii" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" }
];

const VTUBER_OF_THE_YEAR_NOMINEES = [
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "mamura_senpai", name: "mamura_senpai", nickname: "mamura_senpai", login: "mamura_senpai" },
  { id: "margsaur", name: "margsaur", nickname: "margsaur", login: "margsaur" },
  { id: "Karmaliya", name: "Karmaliya", nickname: "Karmaliya", login: "Karmaliya" },
  { id: "Lady_Skeify", name: "Lady_Skeify", nickname: "Lady_Skeify", login: "Lady_Skeify" },
  { id: "AloriWinderer", name: "AloriWinderer", nickname: "AloriWinderer", login: "AloriWinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "nata_riya", name: "nata_riya", nickname: "nata_riya", login: "nata_riya" },
];
const CS_OF_THE_YEAR_NOMINEES = [
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "guthriee", name: "guthriee", nickname: "guthriee", login: "guthriee" },
  { id: "tand1e", name: "tand1e", nickname: "tand1e", login: "tand1e" },
  { id: "aalinchikss", name: "aalinchikss", nickname: "aalinchikss", login: "aalinchikss" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "thunder_oleg", name: "thunder_oleg", nickname: "thunder_oleg", login: "thunder_oleg" },
  { id: "fl1per4", name: "fl1per4", nickname: "fl1per4", login: "fl1per4" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "simyton", name: "simyton", nickname: "simyton", login: "simyton" }
];
const DOTA_OF_THE_YEAR_NOMINEES = [
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "dianosauric", name: "dianosauric", nickname: "dianosauric", login: "dianosauric" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "totustop", name: "totustop", nickname: "totustop", login: "totustop" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "rakuzan777", name: "rakuzan777", nickname: "rakuzan777", login: "rakuzan777" },
  { id: "belonytv", name: "belonytv", nickname: "belonytv", login: "belonytv" },
  { id: "bafik", name: "bafik", nickname: "bafik", login: "bafik" },
  { id: "jex_ua", name: "jex_ua", nickname: "jex_ua", login: "jex_ua" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" }
]
const ALL_OF_THE_YEAR_NOMINEES = [
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "lizetkaa", name: "lizetkaa", nickname: "lizetkaa", login: "lizetkaa" },
  { id: "milatnm", name: "milatnm", nickname: "milatnm", login: "milatnm" },
  { id: "leb1ga", name: "Leb1ga", nickname: "leb1ga", login: "leb1ga" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "roolex9", name: "Roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "missmartik", name: "missmartik", nickname: "missmartik", login: "missmartik" },
  { id: "ivonyak", name: "Ivonyak", nickname: "ivonyak", login: "ivonyak" },
  { id: "veron_khalepa", name: "veron_khalepa", nickname: "veron_khalepa", login: "veron_khalepa" },
  { id: "calypsopaw", name: "calypsopaw", nickname: "calypsopaw", login: "calypsopaw" },
  { id: "itsgolovna", name: "itsgolovna", nickname: "itsgolovna", login: "itsgolovna" },
  { id: "nyavka", name: "nyavka", nickname: "nyavka", login: "nyavka" },
  { id: "riomyri", name: "riomyri", nickname: "riomyri", login: "riomyri" },
  { id: "maryashik", name: "maryashik", nickname: "maryashik", login: "maryashik" },
  { id: "janetty_y", name: "janetty_y", nickname: "janetty_y", login: "janetty_y" },
  { id: "moonosya", name: "moonosya", nickname: "moonosya", login: "moonosya" },
  { id: "sheisfoxy", name: "sheisfoxy", nickname: "sheisfoxy", login: "sheisfoxy" },
  { id: "totoykaa", name: "totoykaa", nickname: "totoykaa", login: "totoykaa" },
  { id: "qwertyrra", name: "qwertyrra", nickname: "qwertyrra", login: "qwertyrra" },
  { id: "lavielay", name: "lavielay", nickname: "lavielay", login: "lavielay" },
  { id: "olsior", name: "Olsior", nickname: "olsior", login: "olsior" },
  { id: "babooreh", name: "babooreh", nickname: "babooreh", login: "babooreh" },
  { id: "my_pivnich", name: "my_pivnich", nickname: "my_pivnich", login: "my_pivnich" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "cusnee", name: "cusnee", nickname: "cusnee", login: "cusnee" },
  { id: "akyulia", name: "akyulia", nickname: "akyulia", login: "akyulia" },
  { id: "rat1bor", name: "rat1bor", nickname: "rat1bor", login: "rat1bor" },
  { id: "sonialimm", name: "sonialimm", nickname: "sonialimm", login: "sonialimm" },
  { id: "lidusik_more", name: "lidusik_more", nickname: "lidusik_more", login: "lidusik_more" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "alinariuk", name: "alinariuk", nickname: "alinariuk", login: "alinariuk" },
  { id: "max_f1ne", name: "max_f1ne", nickname: "max_f1ne", login: "max_f1ne" },
  { id: "deviantsev", name: "deviantsev", nickname: "deviantsev", login: "deviantsev" },
  { id: "xaripso", name: "xaripso", nickname: "xaripso", login: "xaripso" },
  { id: "thejulles", name: "thejulles", nickname: "thejulles", login: "thejulles" },
  { id: "alex_lova", name: "alex_lova", nickname: "alex_lova", login: "alex_lova" },
  { id: "dobra_divka", name: "Dobra_Divka", nickname: "dobra_divka", login: "dobra_divka" },
  { id: "1ankor", name: "1ankor", nickname: "1ankor", login: "1ankor" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "recooniii", name: "recooniii", nickname: "recooniii", login: "recooniii" },
  { id: "cyberkvitochka", name: "cyberkvitochka", nickname: "cyberkvitochka", login: "cyberkvitochka" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "maaaaarriiiii", name: "maaaaarriiiii", nickname: "maaaaarriiiii", login: "maaaaarriiiii" },
  { id: "olejneolej", name: "olejneolej", nickname: "olejneolej", login: "olejneolej" },
  { id: "nerzhaviyka", name: "nerzhaviyka", nickname: "nerzhaviyka", login: "nerzhaviyka" },
  { id: "pankraatik", name: "pankraatik", nickname: "pankraatik", login: "pankraatik" },
  { id: "c1dol3mm", name: "c1dol3mm", nickname: "c1dol3mm", login: "c1dol3mm" },
  { id: "kuzhel_", name: "kuzhel_", nickname: "kuzhel_", login: "kuzhel_" },
  { id: "pask3vych", name: "pask3vych", nickname: "pask3vych", login: "pask3vych" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "verholaa", name: "verholaa", nickname: "verholaa", login: "verholaa" },
  { id: "nasty_cringe", name: "nasty_cringe", nickname: "nasty_cringe", login: "nasty_cringe" },
  { id: "bar_ozzi", name: "bar_ozzi", nickname: "bar_ozzi", login: "bar_ozzi" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "do3r1n", name: "do3r1n", nickname: "do3r1n", login: "do3r1n" },
  { id: "zmiu_shka", name: "zmiu_shka", nickname: "zmiu_shka", login: "zmiu_shka" },
  { id: "lunarilunaa", name: "lunarilunaa", nickname: "lunarilunaa", login: "lunarilunaa" },
  { id: "slippeua", name: "slippeua", nickname: "slippeua", login: "slippeua" },
  { id: "airkurgan", name: "airkurgan", nickname: "airkurgan", login: "airkurgan" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "quarryck", name: "quarryck", nickname: "quarryck", login: "quarryck" },
  { id: "krapkacoma", name: "krapkacoma", nickname: "krapkacoma", login: "krapkacoma" },
  { id: "theoliviette", name: "theoliviette", nickname: "theoliviette", login: "theoliviette" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "itismirai", name: "itismirai", nickname: "itismirai", login: "itismirai" },
  { id: "skevich_", name: "skevich_", nickname: "skevich_", login: "skevich_" },
  { id: "drita_no_bez_d", name: "drita_no_bez_d", nickname: "drita_no_bez_d", login: "drita_no_bez_d" },
  { id: "sss0li", name: "sss0li", nickname: "sss0li", login: "sss0li" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "solid_goodstone", name: "solid_goodstone", nickname: "solid_goodstone", login: "solid_goodstone" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "pixie_itsme", name: "pixie_itsme", nickname: "pixie_itsme", login: "pixie_itsme" },
  { id: "volynyatko", name: "volynyatko", nickname: "volynyatko", login: "volynyatko" },
  { id: "nastya_patsiuk", name: "nastya_patsiuk", nickname: "nastya_patsiuk", login: "nastya_patsiuk" },
  { id: "ssofikooooo", name: "ssofikooooo", nickname: "ssofikooooo", login: "ssofikooooo" },
  { id: "casuscloud", name: "casuscloud", nickname: "casuscloud", login: "casuscloud" },
  { id: "nazaretto333", name: "nazaretto333", nickname: "nazaretto333", login: "nazaretto333" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "icepepepopusk", name: "icepepepopusk", nickname: "icepepepopusk", login: "icepepepopusk" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "bdjolenya", name: "bdjolenya", nickname: "bdjolenya", login: "bdjolenya" },
  { id: "tse_jenya_i_anya", name: "tse_jenya_i_anya", nickname: "tse_jenya_i_anya", login: "tse_jenya_i_anya" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "allidarsu", name: "allidarsu", nickname: "allidarsu", login: "allidarsu" },
  { id: "link2k", name: "link2k", nickname: "link2k", login: "link2k" },
  { id: "solodana", name: "solodana", nickname: "solodana", login: "solodana" },
  { id: "zombakua", name: "zombakua", nickname: "zombakua", login: "zombakua" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "roki_sid", name: "roki_sid", nickname: "roki_sid", login: "roki_sid" },
  { id: "pixelfedya", name: "pixelfedya", nickname: "pixelfedya", login: "pixelfedya" },
  { id: "oryblabla", name: "oryblabla", nickname: "oryblabla", login: "oryblabla" },
  { id: "meditation_ua", name: "meditation_ua", nickname: "meditation_ua", login: "meditation_ua" },
  { id: "adult_woman", name: "adult_woman", nickname: "adult_woman", login: "adult_woman" },
  { id: "cleyrey", name: "cleyrey", nickname: "cleyrey", login: "cleyrey" },
  { id: "connor_qq", name: "connor_qq", nickname: "connor_qq", login: "connor_qq" },
  { id: "depressedcatss", name: "depressedcatss", nickname: "depressedcatss", login: "depressedcatss" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "dramacat", name: "dramacat", nickname: "dramacat", login: "dramacat" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "grudnevaaa", name: "grudnevaaa", nickname: "grudnevaaa", login: "grudnevaaa" },
  { id: "juggua", name: "juggua", nickname: "juggua", login: "juggua" },
  { id: "artone619", name: "artone619", nickname: "artone619", login: "artone619" },
  { id: "blockbaby_4eal", name: "blockbaby_4eal", nickname: "blockbaby_4eal", login: "blockbaby_4eal" },
  { id: "did_shinobi", name: "did_shinobi", nickname: "did_shinobi", login: "did_shinobi" },
  { id: "lusty_dog", name: "lusty_dog", nickname: "lusty_dog", login: "lusty_dog" },
  { id: "spacemanlive", name: "spacemanlive", nickname: "spacemanlive", login: "spacemanlive" },
  { id: "usachman", name: "usachman", nickname: "usachman", login: "usachman" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "moreabsurdy", name: "moreabsurdy", nickname: "moreabsurdy", login: "moreabsurdy" },
  { id: "evil_kaya", name: "evil_kaya", nickname: "evil_kaya", login: "evil_kaya" },
  { id: "yori1k", name: "yori1k", nickname: "yori1k", login: "yori1k" },
  { id: "pol0nskyi", name: "pol0nskyi", nickname: "pol0nskyi", login: "pol0nskyi" },
  { id: "radioboyo", name: "radioboyo", nickname: "radioboyo", login: "radioboyo" },
  { id: "olehovychtut", name: "olehovychtut", nickname: "olehovychtut", login: "olehovychtut" },
  { id: "v0ltm4n", name: "v0ltm4n", nickname: "v0ltm4n", login: "v0ltm4n" },
  { id: "kavalets", name: "kavalets", nickname: "kavalets", login: "kavalets" },
  { id: "dmytro_tyutyun", name: "dmytro_tyutyun", nickname: "dmytro_tyutyun", login: "dmytro_tyutyun" },
  { id: "kharkivets", name: "kharkivets", nickname: "kharkivets", login: "kharkivets" },
  { id: "itsmoysha", name: "itsmoysha", nickname: "itsmoysha", login: "itsmoysha" },
  { id: "nimbleem", name: "nimbleem", nickname: "nimbleem", login: "nimbleem" },
  { id: "aaavrora", name: "aaavrora", nickname: "aaavrora", login: "aaavrora" },
  { id: "dasha_hahaa", name: "dasha_hahaa", nickname: "dasha_hahaa", login: "dasha_hahaa" },
  { id: "mrsilly_boy", name: "mrsilly_boy", nickname: "mrsilly_boy", login: "mrsilly_boy" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "bar_cy4ok", name: "bar_cy4ok", nickname: "bar_cy4ok", login: "bar_cy4ok" },
  { id: "ringoua", name: "ringoua", nickname: "ringoua", login: "ringoua" },
  { id: "dedofu", name: "dedofu", nickname: "dedofu", login: "dedofu" },
  { id: "aloriwinderer", name: "aloriwinderer", nickname: "aloriwinderer", login: "aloriwinderer" },
  { id: "marinade_vtuber", name: "marinade_vtuber", nickname: "marinade_vtuber", login: "marinade_vtuber" },
  { id: "luma_rum", name: "luma_rum", nickname: "luma_rum", login: "luma_rum" },
  { id: "didusyk", name: "didusyk", nickname: "didusyk", login: "didusyk" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "helliaska", name: "helliaska", nickname: "helliaska", login: "helliaska" },
  { id: "minozavr", name: "minozavr", nickname: "minozavr", login: "minozavr" },
  { id: "turtle_silent", name: "turtle_silent", nickname: "turtle_silent", login: "turtle_silent" },
  { id: "lodianyk", name: "lodianyk", nickname: "lodianyk", login: "lodianyk" },
  { id: "yunvi_", name: "yunvi_", nickname: "yunvi_", login: "yunvi_" },
  { id: "xoxomka", name: "xoxomka", nickname: "xoxomka", login: "xoxomka" },
  { id: "kokosovakoza", name: "kokosovakoza", nickname: "kokosovakoza", login: "kokosovakoza" },
  { id: "NeTaneToy", name: "NeTaneToy", nickname: "NeTaneToy", login: "NeTaneToy" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "cakeislieee", name: "cakeislieee", nickname: "cakeislieee", login: "cakeislieee" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
  { id: "pavloviypp", name: "pavloviypp", nickname: "pavloviypp", login: "pavloviypp" },
]
const STREAMER_OF_THE_YEAR_NOMINEES = [
  { id: "deko6", name: "deko6", nickname: "deko6", login: "deko6" },
  { id: "trener", name: "trener", nickname: "trener", login: "trener" },
  { id: "pavloviypp", name: "pavloviypp", nickname: "pavloviypp", login: "pavloviypp" },
  { id: "leb1ga", name: "Leb1ga", nickname: "leb1ga", login: "leb1ga" },
  { id: "thetremba", name: "TheTremba", nickname: "thetremba", login: "thetremba" },
  { id: "valentinopradagucci", name: "valentinopradagucci", nickname: "valentinopradagucci", login: "valentinopradagucci" },
  { id: "roolex9", name: "Roolex9", nickname: "roolex9", login: "roolex9" },
  { id: "ivonyak", name: "Ivonyak", nickname: "ivonyak", login: "ivonyak" },
  { id: "lavielay", name: "lavielay", nickname: "lavielay", login: "lavielay" },
  { id: "olsior", name: "Olsior", nickname: "olsior", login: "olsior" },
  { id: "babooreh", name: "babooreh", nickname: "babooreh", login: "babooreh" },
  { id: "tvorchi_varenychky", name: "tvorchi_varenychky", nickname: "tvorchi_varenychky", login: "tvorchi_varenychky" },
  { id: "rat1bor", name: "rat1bor", nickname: "rat1bor", login: "rat1bor" },
  { id: "ukrsoulful", name: "ukrsoulful", nickname: "ukrsoulful", login: "ukrsoulful" },
  { id: "the_rich_texan", name: "the_rich_texan", nickname: "the_rich_texan", login: "the_rich_texan" },
  { id: "max_f1ne", name: "max_f1ne", nickname: "max_f1ne", login: "max_f1ne" },
  { id: "deviantsev", name: "deviantsev", nickname: "deviantsev", login: "deviantsev" },
  { id: "1ankor", name: "1ankor", nickname: "1ankor", login: "1ankor" },
  { id: "hevko0", name: "hevko0", nickname: "hevko0", login: "hevko0" },
  { id: "1nsane_puncher", name: "1nsane_puncher", nickname: "1nsane_puncher", login: "1nsane_puncher" },
  { id: "olejneolej", name: "olejneolej", nickname: "olejneolej", login: "olejneolej" },
  { id: "c1dol3mm", name: "c1dol3mm", nickname: "c1dol3mm", login: "c1dol3mm" },
  { id: "pask3vych", name: "pask3vych", nickname: "pask3vych", login: "pask3vych" },
  { id: "otolich", name: "otolich", nickname: "otolich", login: "otolich" },
  { id: "bar_ozzi", name: "bar_ozzi", nickname: "bar_ozzi", login: "bar_ozzi" },
  { id: "foxenkko", name: "foxenkko", nickname: "foxenkko", login: "foxenkko" },
  { id: "slippeua", name: "slippeua", nickname: "slippeua", login: "slippeua" },
  { id: "airkurgan", name: "airkurgan", nickname: "airkurgan", login: "airkurgan" },
  { id: "zdarovaotec112", name: "zdarovaotec112", nickname: "zdarovaotec112", login: "zdarovaotec112" },
  { id: "quarryck", name: "quarryck", nickname: "quarryck", login: "quarryck" },
  { id: "krapkacoma", name: "krapkacoma", nickname: "krapkacoma", login: "krapkacoma" },
  { id: "smoky", name: "smoky", nickname: "smoky", login: "smoky" },
  { id: "skevich_", name: "skevich_", nickname: "skevich_", login: "skevich_" },
  { id: "aleksov", name: "aleksov", nickname: "aleksov", login: "aleksov" },
  { id: "solid_goodstone", name: "solid_goodstone", nickname: "solid_goodstone", login: "solid_goodstone" },
  { id: "mxtokyo", name: "mxtokyo", nickname: "mxtokyo", login: "mxtokyo" },
  { id: "volynyatko", name: "volynyatko", nickname: "volynyatko", login: "volynyatko" },
  { id: "casuscloud", name: "casuscloud", nickname: "casuscloud", login: "casuscloud" },
  { id: "nazaretto333", name: "nazaretto333", nickname: "nazaretto333", login: "nazaretto333" },
  { id: "rpoxu", name: "rpoxu", nickname: "rpoxu", login: "rpoxu" },
  { id: "icepepepopusk", name: "icepepepopusk", nickname: "icepepepopusk", login: "icepepepopusk" },
  { id: "difu3en", name: "difu3en", nickname: "difu3en", login: "difu3en" },
  { id: "olejandrooo", name: "olejandrooo", nickname: "olejandrooo", login: "olejandrooo" },
  { id: "tse_jenya_i_anya", name: "tse_jenya_i_anya", nickname: "tse_jenya_i_anya", login: "tse_jenya_i_anya" },
  { id: "kuranvlad", name: "kuranvlad", nickname: "kuranvlad", login: "kuranvlad" },
  { id: "ven4oss", name: "ven4oss", nickname: "ven4oss", login: "ven4oss" },
  { id: "allidarsu", name: "allidarsu", nickname: "allidarsu", login: "allidarsu" },
  { id: "link2k", name: "link2k", nickname: "link2k", login: "link2k" },
  { id: "zombakua", name: "zombakua", nickname: "zombakua", login: "zombakua" },
  { id: "yunglenis", name: "yunglenis", nickname: "yunglenis", login: "yunglenis" },
  { id: "taitake", name: "taitake", nickname: "taitake", login: "taitake" },
  { id: "pixelfedya", name: "pixelfedya", nickname: "pixelfedya", login: "pixelfedya" },
  { id: "meditation_ua", name: "meditation_ua", nickname: "meditation_ua", login: "meditation_ua" },
  { id: "cleyrey", name: "cleyrey", nickname: "cleyrey", login: "cleyrey" },
  { id: "connor_qq", name: "connor_qq", nickname: "connor_qq", login: "connor_qq" },
  { id: "doubleespresso", name: "doubleespresso", nickname: "doubleespresso", login: "doubleespresso" },
  { id: "fur0ske", name: "fur0ske", nickname: "fur0ske", login: "fur0ske" },
  { id: "ghostik", name: "ghostik", nickname: "ghostik", login: "ghostik" },
  { id: "juggua", name: "juggua", nickname: "juggua", login: "juggua" },
  { id: "artone619", name: "artone619", nickname: "artone619", login: "artone619" },
  { id: "blockbaby_4eal", name: "blockbaby_4eal", nickname: "blockbaby_4eal", login: "blockbaby_4eal" },
  { id: "did_shinobi", name: "did_shinobi", nickname: "did_shinobi", login: "did_shinobi" },
  { id: "lusty_dog", name: "lusty_dog", nickname: "lusty_dog", login: "lusty_dog" },
  { id: "spacemanlive", name: "spacemanlive", nickname: "spacemanlive", login: "spacemanlive" },
  { id: "usachman", name: "usachman", nickname: "usachman", login: "usachman" },
  { id: "r0r1ch", name: "r0r1ch", nickname: "r0r1ch", login: "r0r1ch" },
  { id: "moreabsurdy", name: "moreabsurdy", nickname: "moreabsurdy", login: "moreabsurdy" },
  { id: "yori1k", name: "yori1k", nickname: "yori1k", login: "yori1k" },
  { id: "pol0nskyi", name: "pol0nskyi", nickname: "pol0nskyi", login: "pol0nskyi" },
  { id: "radioboyo", name: "radioboyo", nickname: "radioboyo", login: "radioboyo" },
  { id: "olehovychtut", name: "olehovychtut", nickname: "olehovychtut", login: "olehovychtut" },
  { id: "v0ltm4n", name: "v0ltm4n", nickname: "v0ltm4n", login: "v0ltm4n" },
  { id: "kavalets", name: "kavalets", nickname: "kavalets", login: "kavalets" },
  { id: "dmytro_tyutyun", name: "dmytro_tyutyun", nickname: "dmytro_tyutyun", login: "dmytro_tyutyun" },
  { id: "kharkivets", name: "kharkivets", nickname: "kharkivets", login: "kharkivets" },
  { id: "itsmoysha", name: "itsmoysha", nickname: "itsmoysha", login: "itsmoysha" },
  { id: "nimbleem", name: "nimbleem", nickname: "nimbleem", login: "nimbleem" },
  { id: "mrsilly_boy", name: "mrsilly_boy", nickname: "mrsilly_boy", login: "mrsilly_boy" },
  { id: "mr__brom", name: "mr__brom", nickname: "mr__brom", login: "mr__brom" },
  { id: "masllory", name: "masllory", nickname: "masllory", login: "masllory" },
  { id: "ringoua", name: "ringoua", nickname: "ringoua", login: "ringoua" },
  { id: "dedofu", name: "dedofu", nickname: "dedofu", login: "dedofu" },
  { id: "didusyk", name: "didusyk", nickname: "didusyk", login: "didusyk" },
  { id: "vtomleni", name: "vtomleni", nickname: "vtomleni", login: "vtomleni" },
  { id: "panmykolai", name: "panmykolai", nickname: "panmykolai", login: "panmykolai" },
  { id: "sviaks", name: "sviaks", nickname: "sviaks", login: "sviaks" },
  { id: "damnitskyi", name: "damnitskyi", nickname: "damnitskyi", login: "damnitskyi" },
  { id: "villanelle_9", name: "villanelle_9", nickname: "villanelle_9", login: "villanelle_9" },
  { id: "Daelon02", name: "Daelon02", nickname: "Daelon02", login: "Daelon02" },
  { id: "do_minat", name: "do_minat", nickname: "do_minat", login: "do_minat" },
];

const CATEGORIES = [
  {
    id: "streamer_of_the_year",
    title: "Стример року",
    description: "Стример, який зробив цей рік легендарним.",
    type: "streamer",
    nominees: STREAMER_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "streamer_girl_of_the_year",
    title: "Стримеркиня року",
    description: "Стримеркиня, яка зробила цей рік легендарним.",
    type: "streamer",
    nominees: STREAMERKA_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "debut_of_the_year",
    title: "Дебют року",
    description: "Найкращий дебют року серед стримерів, хто почав в 2025 році",
    type: "streamer",
    nominees: DEBUT_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "cringe_of_the_year",
    title: "Крінж року",
    description:
      "Стрімер, який подарував найбільше крінжових, але незабутніх моментів.",
    type: "streamer",
    nominees: ALL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "irl_streamer_of_the_year",
    title: "IRL-стример року",
    description: "Найцікавіші прогулянки, поїздки та живе спілкування.",
    type: "streamer",
    nominees: IRL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "vtuber_of_the_year",
    title: "VTuber року",
    description: "Найяскравіший VTuber року",
    type: "streamer",
    nominees: VTUBER_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "community_of_the_year",
    title: "Комʼюніті року",
    description:
      "Стрімер із найтеплішим, найактивнішим і найприємнішим комʼюніті.",
    type: "streamer",
    nominees: ALL_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "cs_of_the_year",
    title: "CS2-стример року",
    description: "Найкращий CS2-стример року.",
    type: "streamer",
    nominees: CS_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "dota_of_the_year",
    title: "Dota 2 стример року",
    description: "Найкращий Dota 2 стример року.",
    type: "streamer",
    nominees: DOTA_OF_THE_YEAR_NOMINEES,
  },
  {
    id: "gamer_of_the_year",
    title: "Ігровий стример року",
    description: "Стример, який цього року найкраще показав себе в іграх: від соло-проходжень до командних матчів.",
    type: "streamer",
    nominees: ALL_OF_THE_YEAR_NOMINEES,
  }  
];

const avatarClientCache = {};

// рандомайзер
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// правильне слово "стрімер/стрімери/стрімерів"
function getStreamerWord(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;

  if (n > 10 && n < 20) return "стрімерів";
  if (n1 === 1) return "стрімер";
  if (n1 >= 2 && n1 <= 4) return "стрімери";
  return "стрімерів";
}

function StreamerCard({
  categoryId,
  nominee,
  isSelected,
  onSelect,
  className = "",
}) {
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (!nominee.login) return;

    const key = nominee.login.toLowerCase();
    if (avatarClientCache[key]) {
      setAvatarUrl(avatarClientCache[key]);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const r = await fetch(
          `/api/twitch-avatar?login=${encodeURIComponent(key)}`
        );
        if (!r.ok) return;
        const data = await r.json();
        if (!cancelled && data.url) {
          avatarClientCache[key] = data.url;
          setAvatarUrl(data.url);
        }
      } catch (e) {
        console.error("avatar error", key, e);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [nominee.login]);

  const handleSelect = () => onSelect(categoryId, nominee.id);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`cursor-pointer text-center rounded-2xl border px-5 py-5 text-sm md:text-[15px] transition ${
        isSelected
          ? "border-amber-400 bg-amber-400/10"
          : "border-slate-700 bg-black/30 hover:border-amber-300"
      } ${className}`}
    >
      <div className="mx-auto h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
        {avatarUrl ? (
          <img
            src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
            alt={`${nominee.name} avatar`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-base font-semibold text-slate-300">
            {nominee.name?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="font-semibold leading-tight text-[15px]">
          {nominee.name}
        </div>
        {nominee.nickname && (
          <div className="text-xs text-slate-400">@{nominee.nickname}</div>
        )}
      </div>

      {nominee.login && (
        <a
          href={`https://twitch.tv/${nominee.login}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center justify-center gap-1 rounded-full border border-slate-600 px-4 py-1.5 text-[11px] text-slate-300 hover:border-amber-400 hover:text-amber-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span>Twitch</span>
        </a>
      )}
    </div>
  );
}

function getOrCreateVoterToken() {
  if (typeof window === "undefined") return null;

  let token = window.localStorage.getItem(VOTER_TOKEN_KEY);
  if (!token) {
    if (window.crypto && window.crypto.randomUUID) {
      token = window.crypto.randomUUID();
    } else {
      token = Date.now().toString() + "_" + Math.random().toString(16).slice(2);
    }
    window.localStorage.setItem(VOTER_TOKEN_KEY, token);
  }
  return token;
}

export default function StreamerAwardsPage() {
  const [selectedNominees, setSelectedNominees] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [popup, setPopup] = useState(null);

  const [searchByCategory, setSearchByCategory] = useState({});

  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // таймер
  const [timeLeft, setTimeLeft] = useState(null);

  // рандомний порядок номінантів у всіх категоріях
  const [randomCategories] = useState(() =>
    CATEGORIES.map((cat) => ({
      ...cat,
      nominees: shuffleArray(cat.nominees),
    }))
  );

  useEffect(() => {
    getOrCreateVoterToken();

    async function loadAuth() {
      try {
        const r = await fetch("/api/auth/twitch/me", {
          credentials: "include",
        });
        const data = await r.json();
        if (data.loggedIn) {
          setAuthUser(data.user);
        } else {
          setAuthUser(null);
        }
      } catch (e) {
        console.error("auth/me error", e);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuth();
  }, []);

  // оновлення таймера
  useEffect(() => {
    function updateTimer() {
      const deadlineTs = new Date(VOTING_DEADLINE).getTime();
      const now = Date.now();
      const diff = deadlineTs - now;

      if (diff <= 0) {
        setTimeLeft({ ended: true });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      setTimeLeft({ ended: false, days, hours, minutes });
    }

    updateTimer();
    const id = setInterval(updateTimer, 60_000); // раз в хвилину
    return () => clearInterval(id);
  }, []);

  const votingClosed = timeLeft?.ended;

  const handleSelect = (categoryId, nomineeId) => {
    setSelectedNominees((prev) => ({
      ...prev,
      [categoryId]: nomineeId,
    }));
  };

  const allSelected = randomCategories.every((cat) => selectedNominees[cat.id]);

  const handleSubmitAll = async () => {
    if (!authUser) {
      const msgText =
        "Щоб проголосувати, спочатку увійди через Twitch (кнопка зверху).";
      setMessage({ type: "error", text: msgText });
      setPopup({
        type: "error",
        title: "Потрібен логін через Twitch",
        text: msgText,
      });
      return;
    }

    if (typeof window !== "undefined") {
      const already = window.localStorage.getItem(HAS_VOTED_KEY) === "1";
      if (already) {
        const msgText =
          "Ти вже відправив свої голоси з цього пристрою. Проголосувати можна тільки один раз.";
        setMessage({ type: "error", text: msgText });
        setPopup({
          type: "error",
          title: "Голос уже зараховано",
          text: msgText,
        });
        return;
      }
    }

    if (!allSelected) {
      const msgText = "Щоб проголосувати, обери стрімера в КОЖНІЙ категорії.";
      setMessage({
        type: "error",
        text: msgText,
      });
      setPopup({
        type: "error",
        title: "Не всі категорії обрано",
        text: msgText,
      });
      return;
    }

    const voterToken = getOrCreateVoterToken();
    if (!voterToken) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "";
      const nickname =
        authUser?.displayName ||
        authUser?.display_name ||
        authUser?.login ||
        "";

      const votes = randomCategories.map((cat) => {
        const nomineeId = selectedNominees[cat.id];
        const nominee = cat.nominees.find((n) => n.id === nomineeId);
        return {
          categoryId: cat.id,
          categoryTitle: cat.title,
          nomineeId,
          nomineeName: nominee ? nominee.name : "",
          voterToken,
          userAgent,
          nickname,
        };
      });

      const responses = await Promise.all(
        votes.map(async (vote) => {
          try {
            const r = await fetch(VOTE_API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(vote),
            });
            const data = await r.json().catch(() => ({}));
            console.log("Vote response:", vote.categoryId, data);
            return data;
          } catch (e) {
            console.error("Vote error:", vote.categoryId, e);
            return { status: "error", message: String(e) };
          }
        })
      );

      const statuses = responses.map((r) => r.status);

      if (statuses.every((s) => s === "duplicate")) {
        const msgText =
          "Схоже, ти вже голосував. Голос можна віддати один раз з одного Twitch-акаунту.";
        setMessage({
          type: "error",
          text: msgText,
        });
        setPopup({
          type: "error",
          title: "Ти вже голосував",
          text: msgText,
        });
      } else if (statuses.some((s) => s === "error")) {
        const msgText =
          "Частину голосів не вдалося зберегти. Спробуй пізніше.";
        setMessage({
          type: "error",
          text: msgText,
        });
        setPopup({
          type: "error",
          title: "Помилка відправки голосів",
          text: msgText,
        });
      } else {
        const msgText = "Дякуємо! Твої голоси в усіх категоріях зараховані.";
        setMessage({
          type: "success",
          text: msgText,
        });
        setPopup({
          type: "success",
          title: "Голос зараховано",
          text: msgText,
        });

        if (typeof window !== "undefined") {
          window.localStorage.setItem(HAS_VOTED_KEY, "1");
        }
      }
    } catch (e) {
      console.error(e);
      const msgText =
        "Сталася помилка при відправці голосів. Перевір інтернет або спробуй пізніше.";
      setMessage({
        type: "error",
        text: msgText,
      });
      setPopup({
        type: "error",
        title: "Помилка",
        text: msgText,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050509] text-slate-50">
      {/* HERO */}
      <section className="border-b border-slate-800 mt-20 text-center">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="text-2xl uppercase tracking-[0.25em] text-amber-400 mb-2">
            🏆 Народний
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
            Streamer Awards 2025
          </h1>
          <p className="text-slate-300 max-w-2xl text-center mx-auto">
          Вибери свого фаворита в кожній категорії, а потім натисни одну кнопку, щоб віддати голос. Один комплект голосів з одного Twitch-акаунту. Після завершення голосування ми зробимо відео з результатами, а всі підсумки покажемо у відкритій таблиці. Стрімери, які переможуть, отримають ще й символічні подарунки — але які саме, хай поки залишиться маленьким секретом.
          </p>

          {/* таймер */}
          {timeLeft && (
            <div className="mt-4 flex justify-center">
              {timeLeft.ended ? (
                <div className="inline-flex items-center rounded-full border border-red-500/70 bg-red-500/10 px-4 py-2 text-xs md:text-sm text-red-300">
                  Голосування завершено.
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-400/70 bg-amber-400/10 px-4 py-2 text-xs md:text-sm text-amber-100">
                  <span className="font-semibold tracking-wide uppercase">
                    Голосування триває
                  </span>
                  <span className="h-1 w-1 rounded-full bg-amber-400" />
                  <span>
                    До {VOTING_DEADLINE_DISPLAY} залишилось{" "}
                    <strong>
                      {timeLeft.days}д {timeLeft.hours}год {timeLeft.minutes}хв
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            {authLoading ? (
              <span className="text-slate-400">Перевіряємо логін...</span>
            ) : authUser ? (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">
                  Залогінений як{" "}
                  <strong>{authUser.displayName || authUser.login}</strong>
                </span>
                <button
                  type="button"
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:border-red-400 hover:text-red-300"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/twitch/logout", {
                        method: "POST",
                        credentials: "include",
                      });
                      setAuthUser(null);
                    } catch (e) {
                      console.error("logout error", e);
                    }
                  }}
                >
                  Вийти
                </button>
              </div>
            ) : (
              <>
                <span className="text-slate-400">
                  Щоб проголосувати, увійди через Twitch.
                </span>
                <a
                  href="/api/auth/twitch/login?next=/streamer-awards"
                  className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black"
                >
                  Увійти через Twitch
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-slate-800 bg-[#070712]">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <h2 className="text-lg font-semibold mb-4">Як це працює?</h2>
          <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="mb-2 text-amber-400 font-semibold">1. Обираєш</div>
              <p>
                У кожній категорії натискаєш на стрімера, за якого голосуєш.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="mb-2 text-amber-400 font-semibold">
                2. Підтверджуєш
              </div>
              <p>Коли всі категорії заповнені — тиснеш “Проголосувати”.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <div className="mb-2 text-amber-400 font-semibold">
                3. Чекаєш результати
              </div>
              <p>
                Усі голоси потрапляють у таблицю, а потім ми публікуємо
                підсумки.
              </p>
            </div>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`mx-auto mt-6 max-w-6xl px-4 text-sm ${
            message.type === "success" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
      <section className="border-t border-slate-800 bg-[#050509]">
              <div className="mx-auto max-w-6xl px-4 py-8 md:py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl text-sm text-slate-300">
                  <h2 className="text-base font-semibold mb-2">
                    Підтримати нас
                  </h2>
                  <p className="mb-2">
                    Ми не маємо спонсора і робимо все на ентузіазмі. Але всеодно хочемо допомогти якось зсу, тому все що надійде на цю банку, то відправимо на якийсь збір стрімерів і гроші підуть в добру справу.
                  </p>
                </div>
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl border bg-black/60 flex items-center justify-center overflow-hidden">
                  {/* Замінити на реальний QR-код Монобанки */}
                  <img
                    src={code}
                    alt="QR-код Монобанки для підтримки каналу"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
        </section>
      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        {randomCategories.map((cat) => {
          const SEARCHABLE_CATEGORY_IDS = [
            "streamer_of_the_year",
            "streamer_girl_of_the_year",
            "cringe_of_the_year",
            "community_of_the_year",
            "gamer_of_the_year",
          ];
          
          const isSearchableCategory = SEARCHABLE_CATEGORY_IDS.includes(cat.id);

          const searchQuery = (
            searchByCategory[cat.id] || ""
          ).trim().toLowerCase();

          let nomineesToShow = cat.nominees;

          if (isSearchableCategory && searchQuery) {
            nomineesToShow = cat.nominees.filter((n) => {
              const name = (n.name || "").toLowerCase();
              const nick = (n.nickname || "").toLowerCase();
              const login = (n.login || "").toLowerCase();
              return (
                name.includes(searchQuery) ||
                nick.includes(searchQuery) ||
                login.includes(searchQuery)
              );
            });
          }

          return (
            <article
              key={cat.id}
              id={cat.id}
              className="rounded-3xl border border-slate-800 bg-black/40 p-6 md:p-8"
            >
              <header className="mb-4 md:mb-5">
                <p className="text-xs uppercase tracking-[0.25em] text-amber-400 mb-1">
                  Категорія
                </p>
                <h3 className="text-xl md:text-2xl font-bold mb-1">
                  {cat.title}
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl">
                  {cat.description}
                </p>
              </header>

              {/* Пошук для Стрімер року + Стримерка року */}
              {isSearchableCategory ? (
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <input
                    type="text"
                    placeholder="Пошук стрімера за ніком..."
                    value={searchByCategory[cat.id] || ""}
                    onChange={(e) =>
                      setSearchByCategory((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value,
                      }))
                    }
                    className="w-full md:w-96 rounded-full border border-slate-700 bg-black/50 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-sm text-slate-200">
                    У списку {cat.nominees.length}{" "}
                    {getStreamerWord(cat.nominees.length)}
                  </span>
                </div>
              ) : (
                <div className="text-right mb-4 text-sm text-slate-200">
                  У списку {cat.nominees.length}{" "}
                  {getStreamerWord(cat.nominees.length)}
                </div>
              )}

              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {nomineesToShow.map((nominee) => {
                  const isSelected = selectedNominees[cat.id] === nominee.id;
                  return (
                    <StreamerCard
                      key={nominee.id}
                      categoryId={cat.id}
                      nominee={nominee}
                      isSelected={isSelected}
                      onSelect={handleSelect}
                      className="snap-start min-w-[240px] md:min-w-[260px]"
                    />
                  );
                })}

                {nomineesToShow.length === 0 && (
                  <div className="text-sm text-slate-400">
                    Нічого не знайдено за цим запитом.
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {/* кнопка під формою */}
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-800 pt-6">
          <button
            type="button"
            className="self-start rounded-full bg-amber-400 px-7 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
            disabled={!allSelected || submitting || votingClosed}
            onClick={handleSubmitAll}
          >
            {votingClosed
              ? "Голосування завершено"
              : submitting
              ? "Відправляємо голоси..."
              : "Проголосувати за всі категорії"}
          </button>
          <span className="text-xs text-slate-400">
            Щоб кнопка стала активною, потрібно обрати стрімера в кожній
            категорії.
          </span>
        </div>
      </section>

      {/* FAQ під формою */}
      <section className="border-t border-slate-800 bg-[#050509]">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <h2 className="text-lg font-semibold mb-4">FAQ — часті питання</h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Хто може голосувати?
              </h3>
              <p>
                Голосувати може будь-хто, хто має Twitch-акаунт. Ми просимо
                авторизацію тільки для того, щоб уникнути мультиголосування.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Чому можна голосувати лише один раз?
              </h3>
              <p>
                Ми поєднуємо анонімний ID пристрою та Twitch-логін, щоб уникнути
                накруток і зробити результат максимально чесним.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
              <h3 className="font-semibold mb-1 text-slate-100">
                Коли будуть результати?
              </h3>
              <p>
                Після дедлайну голосування ({VOTING_DEADLINE_DISPLAY}) ми
                зіб’ємо результати та опублікуємо їх у відкритому доступі.
              </p>
            </div>
          </div>
        </div>
      </section>  

      {popup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#050509] border border-slate-700 p-5 shadow-xl">
            <h2 className="text-lg font-semibold mb-2">{popup.title}</h2>
            <p className="text-sm text-slate-300 mb-4">{popup.text}</p>
            <button
              type="button"
              className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black"
              onClick={() => setPopup(null)}
            >
              Окей
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
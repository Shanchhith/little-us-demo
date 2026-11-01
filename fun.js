(() => {
  const fortunes = [
    "You will soon be asked, “What do you want to eat?” Answer in under 10 minutes and win a prize.",
    "A great hug is in your future. It may be sudden. It may be unavoidable.",
    "Someone near you thinks you are the cutest. Do not look behind you. It is you.",
    "You will laugh at something that is not funny, and the other person will laugh harder because of it.",
    "Beware: snacks will disappear mysteriously today. The culprit is closer than you think.",
    "Your lucky numbers are 1, 2, and “just five more minutes.”",
    "A warm blanket and a long nap will find you. Resistance is useless.",
    "You are about to say “I’m not hungry” and then eat half of someone else’s food.",
    "Great fortune awaits: the last piece will be offered to you, and you will pretend to refuse.",
    "Today, you will win an argument by being adorable. The law allows this.",
  ];

  const openings = [
    "After careful consideration and one dramatic sigh,",
    "Having reviewed the evidence (mostly vibes),",
    "By the power vested in me by absolutely nobody,",
    "Following a very serious snack break,",
  ];
  const verdicts = [
    "this court rules in favour of whoever apologises first, with a snack as a settlement.",
    "both parties are guilty of being too cute to stay mad. Case dismissed with a hug.",
    "the accused must give one forehead kiss and say “you’re right” in a funny voice.",
    "the court finds this issue 90% hunger and 10% sleepiness. Prescribed: food and a nap.",
    "the loser must do the dishes, or at least stand near them looking sorry.",
    "the matter is settled by rock-paper-scissors, best of three, no crying.",
    "the court orders both sides to hold hands and agree that the real enemy is Monday.",
    "the defendant is sentenced to one dramatic reenactment of the whole argument.",
  ];

  const coupons = [
    "One free hug, dramatic and extra long",
    "Redeem for one “you choose the movie” night, no complaining",
    "Good for one guilt-free bite of my dessert",
    "One forehead kiss on demand, valid anywhere",
    "A silly voice for an entire conversation of your choice",
    "Skip one chore. The coupon holder gets to watch me do it",
    "One free “I’ll go get it” when you’re too comfy to get up",
    "Voucher for 10 minutes of undivided back-scratching",
    "Redeem for one very serious compliment. May cause blushing",
    "One free pass to be right about something small",
  ];

  const lastPicked = new Map();
  function pick(name, items) {
    let index;
    do {
      index = Math.floor(Math.random() * items.length);
    } while (items.length > 1 && index === lastPicked.get(name));
    lastPicked.set(name, index);
    return items[index];
  }

  function show(output, text) {
    output.textContent = text;
    output.classList.remove("pop");
    void output.offsetWidth;
    output.classList.add("pop");
  }

  document.querySelector("#fortune-button").addEventListener("click", () => {
    show(document.querySelector("#fortune-output"), `🥠 ${pick("fortune", fortunes)}`);
  });

  document.querySelector("#court-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#court-case");
    const complaint = input.value.trim();
    const intro = complaint ? `In the case of “${complaint}”: ` : "";
    show(document.querySelector("#court-output"), `⚖️ ${intro}${pick("opening", openings)} ${pick("verdict", verdicts)}`);
  });

  document.querySelector("#coupon-button").addEventListener("click", () => {
    show(document.querySelector("#coupon-output"), `🎟️ ${pick("coupon", coupons)}`);
  });
})();

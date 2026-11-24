(() => {
  let challenge = "",
    widget = null,
    working = false;
  const cfg = document.createElement("script");
  cfg.src = "/quote-config.js";
  cfg.onload = () => {
    if (!window.ABK_QUOTE_SITE_KEY) return;
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    document.head.append(script);
  };
  document.head.append(cfg);
  async function enhance() {
    const result = document.querySelector(".quote-result");
    if (
      working ||
      !result ||
      result.hidden ||
      result.querySelector("[data-inbox]")
    )
      return;
    working = true;
    try {
      const health = await fetch("/api/gestion?action=health").then((r) =>
        r.ok ? r.json() : null,
      );
      if (!health?.quotes) return;
      const section = document.createElement("section");
      section.dataset.inbox = "";
      section.innerHTML =
        '<p>Envoyez directement votre demande à l’équipe ABK.</p><div data-challenge></div><button type="button" class="button primary" data-submit-inbox>Envoyer ma demande à ABK</button><p data-inbox-status role="status"></p>';
      result.prepend(section);
      const button = section.querySelector("button");
      if (health.challenge) {
        button.disabled = true;
        if (!window.turnstile || !window.ABK_QUOTE_SITE_KEY) {
          section.querySelector("[data-inbox-status]").textContent =
            "La protection du formulaire est indisponible. Utilisez l’envoi par messagerie ci-dessous.";
        } else
          widget = window.turnstile.render(
            section.querySelector("[data-challenge]"),
            {
              sitekey: window.ABK_QUOTE_SITE_KEY,
              action: "quote",
              callback: (value) => {
                challenge = value;
                button.disabled = false;
              },
              "expired-callback": () => {
                challenge = "";
                button.disabled = true;
              },
            },
          );
      }
      button.onclick = async () => {
        const form = result.parentElement.querySelector("form");
        button.disabled = true;
        try {
          const fields = new FormData(form),
            content = result.querySelector("textarea").value;
          const response = await fetch("/api/gestion?action=quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: fields.get("nom"),
              email: fields.get("email"),
              phone: fields.get("telephone"),
              category: content.includes("Réserve incendie")
                ? "incendie"
                : content.includes("Bâti & rénovation")
                  ? "renovation"
                  : "piscine",
              content,
              consent: fields.get("consent") === "on",
              website: fields.get("website") || "",
              challenge,
              source: location.pathname,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || "Envoi impossible.");
          section.querySelector("[data-inbox-status]").textContent =
            "Demande reçue par ABK. Référence : " + data.reference;
          button.hidden = true;
        } catch (error) {
          section.querySelector("[data-inbox-status]").textContent =
            error.message;
          if (widget !== null) window.turnstile.reset(widget);
          else button.disabled = false;
        }
      };
    } catch {
      /* Existing mail workflow stays available. */
    } finally {
      working = false;
    }
  }
  new MutationObserver(enhance).observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"],
    childList: true,
  });
})();

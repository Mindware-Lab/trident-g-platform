const IQM_SITE_URL = "https://www.iqmindware.com"
const IQM_ORGANIZATION_ID = `${IQM_SITE_URL}/#organization`
const IQM_WEBSITE_ID = `${IQM_SITE_URL}/#website`
const IQM_PERSON_ID = `${IQM_SITE_URL}/about/#dr-mark-ashton-smith`

async function loadJson(path) {
  const response = await fetch(path)
  if (!response.ok) return null
  return response.json()
}

async function renderPricing() {
  const grid = document.getElementById("pricingGrid")
  if (!grid) return

  const matrix = await loadJson("/pricing-matrix.json")
  if (!matrix || !Array.isArray(matrix.plans)) {
    grid.innerHTML = '<p class="card">Pricing matrix unavailable.</p>'
    return
  }

  let currency = "USD"
  const buttons = Array.from(document.querySelectorAll("[data-currency]"))

  function render() {
    buttons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.currency === currency)
    )
    grid.innerHTML = matrix.plans
      .map((plan) => {
        const value = currency === "GBP" ? plan.price_gbp : plan.price_usd
        const symbol = currency === "GBP" ? "GBP " : "USD "
        const discounts = Object.fromEntries(
          Object.entries(plan.discounts || {}).filter(
            ([k]) => !/existing/i.test(k)
          )
        )
        const discountRows = Object.keys(discounts).length
          ? `<ul>${Object.entries(discounts)
              .map(
                ([k, v]) =>
                  `<li>${k}: ${symbol}${
                    currency === "GBP" ? v.gbp : v.usd
                  }</li>`
              )
              .join("")}</ul>`
          : "<p>No launch discount rows.</p>"
        const includes = (plan.includes || [])
          .map((x) => `<li>${x}</li>`)
          .join("")
        return `
        <article class="card pricing-card">
          <h3>${plan.label}</h3>
          <p class="price">${symbol}${value}</p>
          <p>${plan.billing}</p>
          <p><strong>Choose this if:</strong> ${plan.choose_if}</p>
          <details><summary>Includes</summary><ul>${includes}</ul></details>
          <details><summary>Launch discounts</summary>${discountRows}</details>
        </article>
      `
      })
      .join("")
  }

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      currency = btn.dataset.currency
      render()
    })
  )

  render()
}

async function renderCadence() {
  const container = document.getElementById("cadenceList")
  if (!container) return

  const cadence = await loadJson("/proof-cadence.json")
  if (!cadence || !Array.isArray(cadence.items)) {
    container.innerHTML = "<p>Cadence data unavailable.</p>"
    return
  }

  container.innerHTML = `<h3>Publication cadence</h3><ul>${cadence.items
    .map(
      (item) =>
        `<li><strong>${item.summary_name}:</strong> ${item.cadence} (owner: ${item.owner})</li>`
    )
    .join("")}</ul>`
}

function normalizePath(path) {
  if (!path) return "/"

  const clean = path
    .split("?")[0]
    .split("#")[0]
    .replace(/index\.html$/i, "")
    .toLowerCase()

  if (clean === "" || clean === "/") return "/"
  return clean.endsWith("/") ? clean : clean + "/"
}

function primaryNavPath(pathname) {
  const path = normalizePath(pathname)

  if (path.startsWith("/tools/")) return "/tools/"
  if (path.startsWith("/proof/")) return "/proof/"
  if (path.startsWith("/za/pricing/")) return "/pricing/"
  if (path.startsWith("/pricing/")) return "/pricing/"
  if (path.startsWith("/coaching/")) return "/coaching/"
  if (path.startsWith("/learn/")) return "/learn/"
  if (path.startsWith("/about/")) return "/about/"
  if (path.startsWith("/faq/")) return "/faq/"
  if (path.startsWith("/support/")) return "/support/"
  if (path.startsWith("/contact/")) return "/support/"
  if (path.startsWith("/privacy/")) return "/support/"
  if (path.startsWith("/terms/")) return "/support/"
  if (path.startsWith("/refunds/")) return "/support/"
  if (path.startsWith("/cases/")) return "/proof/"
  if (path.startsWith("/how-it-works/")) return "/start/"
  if (path.startsWith("/start/")) return "/start/"

  return null
}

function highlightCurrentNav() {
  const navLinks = Array.from(
    document.querySelectorAll(".site-header .site-nav .nav-link")
  )
  if (!navLinks.length) return

  navLinks.forEach((link) => {
    link.classList.remove("is-current")
    link.removeAttribute("aria-current")
  })

  const activePath = primaryNavPath(window.location.pathname)
  if (!activePath) return

  const activeLink = navLinks.find(
    (link) => normalizePath(link.getAttribute("href")) === activePath
  )
  if (!activeLink) return

  activeLink.classList.add("is-current")
  activeLink.setAttribute("aria-current", "page")
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
}

function truncateText(value, maxLength = 220) {
  const text = cleanText(value)
  if (!text || text.length <= maxLength) return text

  const shortened = text.slice(0, maxLength).replace(/\s+\S*$/, "")
  return `${shortened}...`
}

function compactValue(value) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => compactValue(item))
      .filter((item) => item !== undefined)
    return items.length ? items : undefined
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).reduce((acc, [key, item]) => {
      const compacted = compactValue(item)
      if (compacted !== undefined) acc[key] = compacted
      return acc
    }, {})
    return Object.keys(entries).length ? entries : undefined
  }

  if (value === undefined || value === null || value === "") return undefined
  return value
}

function textFromSelector(selector, root = document) {
  return cleanText(root.querySelector(selector)?.textContent)
}

function textFromSelectors(selectors, root = document) {
  for (const selector of selectors) {
    const text = textFromSelector(selector, root)
    if (text) return text
  }
  return ""
}

function hrefToAbsolute(href) {
  const value = cleanText(href)
  if (!value) return ""
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value
  if (value.startsWith("//")) return `https:${value}`

  if (value.startsWith("/")) return `${IQM_SITE_URL}${value}`
  return `${IQM_SITE_URL}/${value.replace(/^\.?\//, "")}`
}

function currentPageUrl() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href
  if (canonical) return canonical
  return hrefToAbsolute(normalizePath(window.location.pathname))
}

function currentPageTitle() {
  return cleanText(document.title).replace(/\s*\|\s*IQMindware$/i, "")
}

function currentPageDescription() {
  const metaDescription = cleanText(
    document.querySelector('meta[name="description"]')?.content
  )
  if (metaDescription) return metaDescription

  const heroCopy = textFromSelectors([
    ".home-hero-sub",
    ".tool-hero-sub",
    ".tool-hero-lead",
    ".pricing-hero-desc",
    ".proof-hero-desc",
    ".ab-hero-sub",
    ".co-hero-sub",
    ".faq-hero-sub",
    ".sp-hero-sub",
    ".ct-hero-sub",
    ".bl-hero-sub",
    ".wk-hero-sub",
    "main p",
  ])

  return truncateText(heroCopy, 220)
}

function pageImageUrls(selector, limit = 6) {
  return Array.from(document.querySelectorAll(selector))
    .map((node) => node.getAttribute("src"))
    .map((src) => hrefToAbsolute(src))
    .filter(Boolean)
    .slice(0, limit)
}

function firstPageImage() {
  return (
    pageImageUrls(
      ".bl-article-lead img, .tool-gallery-grid img, .home-founder-photo, .ab-founder-photo, main img",
      1
    )[0] || ""
  )
}

function schemaTypesInPage() {
  const types = new Set()

  function addTypes(data) {
    if (!data || typeof data !== "object") return

    if (Array.isArray(data)) {
      data.forEach((item) => addTypes(item))
      return
    }

    const schemaType = data["@type"]
    if (Array.isArray(schemaType)) {
      schemaType.forEach((item) => types.add(item))
    } else if (typeof schemaType === "string") {
      types.add(schemaType)
    }

    if (Array.isArray(data["@graph"])) {
      data["@graph"].forEach((item) => addTypes(item))
    }
  }

  document
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((script) => {
      try {
        addTypes(JSON.parse(script.textContent))
      } catch (error) {
        console.warn("Unable to parse existing JSON-LD block.", error)
      }
    })

  return types
}

function createListItems(items, itemType = "Thing") {
  return items.map((item, index) =>
    compactValue({
      "@type": "ListItem",
      position: index + 1,
      item: compactValue({
        "@type": item.type || itemType,
        name: item.name,
        url: item.url,
        description: item.description,
      }),
    })
  )
}

function collectSameAsLinks() {
  const links = Array.from(document.querySelectorAll(".footer-social a[href]"))
    .filter((link) => link.dataset.platform !== "discord")
    .map((link) => hrefToAbsolute(link.getAttribute("href")))
    .filter((href) => /^https?:\/\//i.test(href))

  return Array.from(new Set(links))
}

function buildOrganizationSchema() {
  return compactValue({
    "@type": "Organization",
    "@id": IQM_ORGANIZATION_ID,
    name: "IQMindware",
    url: IQM_SITE_URL,
    logo: compactValue({
      "@type": "ImageObject",
      url: hrefToAbsolute("/branding/Trident-G-Icon-green.svg"),
    }),
    image: hrefToAbsolute("/assets/img/dr-mark-ashton-smith.jpg"),
    email: "admin@iqmindware.com",
    sameAs: collectSameAsLinks(),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "admin@iqmindware.com",
        url: hrefToAbsolute("/support/"),
        availableLanguage: ["en-GB", "en-US"],
      },
      {
        "@type": "ContactPoint",
        contactType: "business enquiries",
        email: "mark@iqmindware.com",
        url: hrefToAbsolute("/contact/"),
        availableLanguage: ["en-GB", "en-US"],
      },
    ],
  })
}

function buildWebSiteSchema() {
  return compactValue({
    "@type": "WebSite",
    "@id": IQM_WEBSITE_ID,
    url: IQM_SITE_URL,
    name: "IQMindware",
    publisher: { "@id": IQM_ORGANIZATION_ID },
    inLanguage: "en-GB",
  })
}

function breadcrumbLabel(segment) {
  const labels = {
    about: "About",
    start: "Start",
    student: "Student",
    performance: "Performance",
    resilience: "Resilience",
    tools: "Apps",
    "g-tracker": "G Tracker",
    "zone-coach": "Zone Coach",
    "capacity-gym": "Capacity Gym",
    "mindware-gym": "Mindware Gym",
    proof: "Proof",
    protocols: "Protocols",
    pricing: "Plans",
    coaching: "Coaching",
    learn: "Learn",
    blog: "Blog",
    wiki: "Wiki",
    faq: "FAQ",
    support: "Support",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    refunds: "Refunds",
    cases: "Cases",
    "how-it-works": "How it works",
  }

  return labels[segment] || cleanText(segment.replace(/-/g, " "))
}

function buildBreadcrumbSchema() {
  const path = normalizePath(window.location.pathname)
  if (path === "/") return null

  const rawSegments = path
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "za")
    .filter(
      (segment, index, all) =>
        !(segment === "info" && index === all.length - 1 && all.length > 1)
    )

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: IQM_SITE_URL,
    },
  ]

  let currentPath = ""
  rawSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === rawSegments.length - 1
    const name = isLast
      ? cleanText(document.querySelector("h1")?.textContent) ||
        currentPageTitle() ||
        breadcrumbLabel(segment)
      : breadcrumbLabel(segment)

    items.push({
      "@type": "ListItem",
      position: items.length + 1,
      name,
      item: hrefToAbsolute(`${currentPath}/`),
    })
  })

  return {
    "@type": "BreadcrumbList",
    "@id": `${currentPageUrl()}#breadcrumb`,
    itemListElement: items,
  }
}

function pageSchemaType(path) {
  if (path === "/about/") return "AboutPage"
  if (path === "/contact/" || path === "/support/") return "ContactPage"
  if (
    path === "/learn/" ||
    path === "/learn/blog/" ||
    path === "/learn/wiki/" ||
    path === "/tools/" ||
    path === "/proof/" ||
    path === "/cases/"
  ) {
    return "CollectionPage"
  }
  return "WebPage"
}

function buildWebPageSchema(mainEntityId) {
  const image = firstPageImage()
  const path = normalizePath(window.location.pathname)

  return compactValue({
    "@type": pageSchemaType(path),
    "@id": `${currentPageUrl()}#webpage`,
    url: currentPageUrl(),
    name: currentPageTitle(),
    description: currentPageDescription(),
    inLanguage: "en-GB",
    isPartOf: { "@id": IQM_WEBSITE_ID },
    publisher: { "@id": IQM_ORGANIZATION_ID },
    breadcrumb:
      path === "/" ? undefined : { "@id": `${currentPageUrl()}#breadcrumb` },
    primaryImageOfPage: image,
    mainEntity: mainEntityId ? { "@id": mainEntityId } : undefined,
  })
}

function buildFaqSchema(itemSelector, questionSelector, answerSelector, idSuffix) {
  const items = Array.from(document.querySelectorAll(itemSelector))
    .map((item) => {
      const question = cleanText(item.querySelector(questionSelector)?.textContent)
      const answer = cleanText(item.querySelector(answerSelector)?.textContent)
      if (!question || !answer) return null
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      }
    })
    .filter(Boolean)

  if (!items.length) return null

  return {
    "@type": "FAQPage",
    "@id": `${currentPageUrl()}#${idSuffix}`,
    url: currentPageUrl(),
    name: currentPageTitle(),
    description: currentPageDescription(),
    mainEntity: items,
  }
}

function itemListFromCards(cardSelector, config) {
  const cards = Array.from(document.querySelectorAll(cardSelector))
  if (!cards.length) return null

  const items = cards
    .map((card) => {
      const name = cleanText(card.querySelector(config.nameSelector)?.textContent)
      const description = truncateText(
        cleanText(card.querySelector(config.descriptionSelector)?.textContent),
        220
      )
      const linkNode = card.matches(config.linkSelector)
        ? card
        : card.querySelector(config.linkSelector)
      const href = linkNode?.getAttribute("href")
      const url = hrefToAbsolute(href)

      if (!name || !url) return null
      return {
        name,
        description,
        url,
        type: config.itemType || "Thing",
      }
    })
    .filter(Boolean)

  if (!items.length) return null

  return compactValue({
    "@type": "ItemList",
    "@id": `${currentPageUrl()}#${config.idSuffix}`,
    name: config.name,
    itemListElement: createListItems(items, config.itemType || "Thing"),
  })
}

function toolDetailUrl(name) {
  const detailRoutes = {
    "G Tracker": "/tools/g-tracker/",
    "Zone Coach": "/tools/zone-coach/",
    "Capacity Gym": "/tools/capacity-gym/info/",
    "Mindware Gym": "/tools/mindware-gym/",
    "IQ Core": "/pricing/",
  }

  return hrefToAbsolute(detailRoutes[name] || "/pricing/")
}

function buildToolSchema() {
  if (!document.querySelector(".tool-detail-page")) return null

  const screenshots = pageImageUrls(".tool-gallery-grid img", 8)
  const featureList = Array.from(document.querySelectorAll(".tool-pillar h3"))
    .map((item) => cleanText(item.textContent))
    .filter(Boolean)

  return compactValue({
    "@type": "SoftwareApplication",
    "@id": `${currentPageUrl()}#software`,
    name: cleanText(document.querySelector("h1")?.textContent),
    url: currentPageUrl(),
    description:
      textFromSelectors([".tool-hero-sub", ".tool-hero-lead"]) ||
      currentPageDescription(),
    applicationCategory:
      textFromSelector(".tool-hero-eyebrow") || "Web application",
    operatingSystem: "Web browser",
    browserRequirements: "Modern desktop or mobile web browser",
    image: screenshots[0] || firstPageImage(),
    screenshot: screenshots,
    featureList,
    creator: { "@id": IQM_ORGANIZATION_ID },
    publisher: { "@id": IQM_ORGANIZATION_ID },
    isAccessibleForFree: false,
    offers: {
      "@type": "Offer",
      url: hrefToAbsolute("/pricing/"),
      availability: "https://schema.org/InStock",
      category: "90-day launch pass",
    },
  })
}

function numericPrice(value) {
  const numeric = String(value || "").replace(/[^0-9.]/g, "")
  return numeric ? Number(numeric) : undefined
}

function buildPricingCatalogSchema() {
  if (!document.body.classList.contains("pricing")) return null

  const planOffers = Array.from(document.querySelectorAll(".plan-card"))
    .map((card) => {
      const name = cleanText(card.querySelector(".plan-name")?.textContent)
      const tagline = cleanText(card.querySelector(".plan-tagline")?.textContent)
      const chooseThis = cleanText(
        card.querySelector(".plan-include-list li")?.textContent
      )
      const price = numericPrice(
        card.querySelector(".plan-amount")?.textContent ||
          card.querySelector(".plan-amount")?.dataset?.usd
      )

      if (!name || !price) return null

      return compactValue({
        "@type": "Offer",
        name: `${name} plan`,
        url: currentPageUrl(),
        price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Product",
          name,
          url: toolDetailUrl(name),
          description: truncateText(`${tagline} ${chooseThis}`, 220),
        },
      })
    })
    .filter(Boolean)

  const coachingOffers = Array.from(document.querySelectorAll(".coaching-card"))
    .map((card) => {
      const name = cleanText(card.querySelector(".coaching-name")?.textContent)
      const tagline = cleanText(
        card.querySelector(".coaching-tagline")?.textContent
      )
      const bestFor = cleanText(
        Array.from(card.querySelectorAll(".coaching-row"))
          .find((row) =>
            /best for/i.test(cleanText(row.querySelector(".coaching-row-label")?.textContent))
          )
          ?.querySelector(".coaching-row-value")?.textContent
      )
      const price = numericPrice(
        card.querySelector(".coaching-price-amount")?.textContent
      )

      if (!name || !price) return null

      return compactValue({
        "@type": "Offer",
        name,
        url: currentPageUrl(),
        price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name,
          description: truncateText(`${tagline} ${bestFor}`, 220),
        },
      })
    })
    .filter(Boolean)

  const offers = [...planOffers, ...coachingOffers]
  if (!offers.length) return null

  return {
    "@type": "OfferCatalog",
    "@id": `${currentPageUrl()}#offers`,
    name: "IQMindware plans and coaching offers",
    url: currentPageUrl(),
    itemListElement: offers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: offer,
    })),
  }
}

function buildCoachingServiceSchema() {
  if (!document.body.classList.contains("coaching")) return null

  const offers = Array.from(document.querySelectorAll(".co-pkg-card"))
    .map((card) => {
      const name = cleanText(card.querySelector(".co-pkg-name")?.textContent)
      const price = numericPrice(card.querySelector(".co-pkg-amount")?.textContent)
      const description = truncateText(
        [
          cleanText(card.querySelector(".co-pkg-tagline")?.textContent),
          cleanText(card.querySelector(".co-pkg-choose")?.textContent),
        ]
          .filter(Boolean)
          .join(" "),
        220
      )

      if (!name || !price) return null

      return compactValue({
        "@type": "Offer",
        name,
        price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: currentPageUrl(),
        description,
      })
    })
    .filter(Boolean)

  return compactValue({
    "@type": "Service",
    "@id": `${currentPageUrl()}#service`,
    name: "IQMindware Cognitive Coaching",
    serviceType: "Cognitive coaching",
    url: currentPageUrl(),
    description: currentPageDescription(),
    provider: { "@id": IQM_ORGANIZATION_ID },
    areaServed: "Worldwide",
    audience: {
      "@type": "Audience",
      audienceType: "Knowledge workers, founders, and students",
    },
    image: hrefToAbsolute("/assets/img/dr-mark-ashton-smith.jpg"),
    offers,
  })
}

function buildMarkPersonSchema(includeEmail = false) {
  const sameAs = Array.from(
    new Set(
      [
        hrefToAbsolute("https://www.linkedin.com/in/drmarkasmith/"),
        hrefToAbsolute("https://osf.io/np658/"),
        hrefToAbsolute("https://www.researchgate.net/profile/Mark-Ashton-Smith-3"),
      ].filter(Boolean)
    )
  )

  return compactValue({
    "@type": "Person",
    "@id": IQM_PERSON_ID,
    name: "Dr Mark Ashton Smith",
    url: hrefToAbsolute("/about/"),
    image: hrefToAbsolute("/assets/img/dr-mark-ashton-smith-about.jpg"),
    jobTitle: "Founder and scientific lead",
    worksFor: { "@id": IQM_ORGANIZATION_ID },
    email: includeEmail ? "mark@iqmindware.com" : undefined,
    sameAs,
    knowsAbout: [
      "Cognitive neuroscience",
      "General intelligence",
      "Far transfer",
      "Cognitive training",
      "AI and cognition",
    ],
  })
}

function buildProofProtocolListSchema() {
  if (!document.body.classList.contains("proof")) return null

  const items = Array.from(document.querySelectorAll(".protocol-card"))
    .map((card) => {
      const name = cleanText(card.querySelector(".protocol-name")?.textContent)
      const description = truncateText(
        [
          cleanText(card.querySelector(".protocol-tagline")?.textContent),
          cleanText(
            card.querySelector(".protocol-row .protocol-row-value")?.textContent
          ),
        ]
          .filter(Boolean)
          .join(" "),
        220
      )
      const url =
        hrefToAbsolute(
          card.querySelector(".protocol-badge--link")?.getAttribute("href")
        ) || currentPageUrl()

      if (!name || !url) return null
      return { name, description, url, type: "CreativeWork" }
    })
    .filter(Boolean)

  if (!items.length) return null

  return {
    "@type": "ItemList",
    "@id": `${currentPageUrl()}#protocol-list`,
    name: "Published IQMindware protocols",
    itemListElement: createListItems(items, "CreativeWork"),
  }
}

function buildLearnHubSchemas() {
  if (document.body.classList.contains("tools")) {
    return itemListFromCards(".tool-card", {
      idSuffix: "app-list",
      name: "IQMindware apps",
      nameSelector: ".tool-name",
      descriptionSelector: ".tool-purpose",
      linkSelector: ".tool-cta-primary",
      itemType: "SoftwareApplication",
    })
  }

  if (document.body.classList.contains("blog") && document.querySelector(".bl-grid")) {
    return compactValue({
      "@type": "Blog",
      "@id": `${currentPageUrl()}#blog`,
      name: "IQMindware Blog",
      url: currentPageUrl(),
      description: currentPageDescription(),
      publisher: { "@id": IQM_ORGANIZATION_ID },
      blogPost: Array.from(document.querySelectorAll(".bl-card"))
        .map((card) => {
          const name = cleanText(card.querySelector(".bl-card-title")?.textContent)
          const url = hrefToAbsolute(
            card.querySelector(".bl-card-link")?.getAttribute("href")
          )
          const description = truncateText(
            cleanText(card.querySelector(".bl-card-excerpt")?.textContent),
            220
          )

          if (!name || !url) return null
          return compactValue({
            "@type": "BlogPosting",
            headline: name,
            url,
            description,
          })
        })
        .filter(Boolean),
    })
  }

  if (document.body.classList.contains("wiki") && document.querySelector(".wk-index")) {
    return itemListFromCards(".wk-row", {
      idSuffix: "wiki-list",
      name: "IQMindware wiki entries",
      nameSelector: ".wk-row-term",
      descriptionSelector: ".wk-row-def",
      linkSelector: ".wk-row-link",
      itemType: "DefinedTerm",
    })
  }

  if (document.body.classList.contains("learn") && document.querySelector(".lh-hub-card")) {
    return itemListFromCards(".lh-hub-card", {
      idSuffix: "learn-list",
      name: "IQMindware learning hubs",
      nameSelector: ".lh-hub-card-title, h2, h3",
      descriptionSelector: ".lh-hub-card-text, p",
      linkSelector: "a[href]",
      itemType: "CollectionPage",
    })
  }

  return null
}

function buildSupportFaqSchema() {
  if (!document.body.classList.contains("support")) return null
  return buildFaqSchema(".sp-faq-item", ".sp-faq-q", ".sp-faq-a", "support-faq")
}

function buildFaqPageSchema() {
  if (!document.body.classList.contains("faq")) return null
  return buildFaqSchema(".faq-item", ".faq-q-text", ".faq-a", "faq")
}

function buildContactPageMainEntity(path) {
  if (path === "/about/") return `${IQM_PERSON_ID}`
  if (path === "/contact/") return `${IQM_PERSON_ID}`
  if (document.querySelector(".tool-detail-page")) return `${currentPageUrl()}#software`
  if (document.body.classList.contains("pricing")) return `${currentPageUrl()}#offers`
  if (document.body.classList.contains("coaching")) return `${currentPageUrl()}#service`
  if (document.body.classList.contains("proof")) return `${currentPageUrl()}#protocol-list`
  if (document.body.classList.contains("tools")) return `${currentPageUrl()}#app-list`
  if (document.body.classList.contains("wiki") && document.querySelector(".wk-index")) {
    return `${currentPageUrl()}#wiki-list`
  }
  if (document.body.classList.contains("learn") && document.querySelector(".lh-hub-card")) {
    return `${currentPageUrl()}#learn-list`
  }
  if (document.body.classList.contains("blog") && document.querySelector(".bl-grid")) {
    return `${currentPageUrl()}#blog`
  }
  if (path === "/faq/") return `${currentPageUrl()}#faq`
  return undefined
}

const BREVO_SIGNUP_FORM_URL =
  "https://e287205c.sibforms.com/serve/MUIFAJD01nPYezZRJNU5f5-z57gqUO9A0-DknttJV5VvRRH9CSPY2gJO8RWK0fyTYZw7Pz4yHVunCGQsZGp99u6LjVNpGQouxx3xTXVduP1F97vskESxC0VKRFIEZEeULZJ34ii-Xmb2D7YTur5aU7X6zvnYkTwJzA2ISJZ1kL5VddiqfysLVEZfsi5zb5Edypy-sc5gvCT_goF58w=="

function buildSignupButton(label, extraClass = "") {
  const className = ["btn", "btn-lime", "btn-sm", extraClass]
    .filter(Boolean)
    .join(" ")
  return `<a class="${className}" href="${BREVO_SIGNUP_FORM_URL}" target="_blank" rel="noopener noreferrer">${label}</a>`
}

function buildSignupIframe(frameTitle) {
  return `
    <div class="iqm-signup-iframe-wrap">
      <iframe
        class="iqm-signup-iframe"
        src="${BREVO_SIGNUP_FORM_URL}"
        title="${frameTitle}"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  `
}

function buildSignupEmbedSection({
  sectionClass = "",
  eyebrow,
  title,
  text,
  frameTitle,
  buttonLabel,
}) {
  return `
    <section class="iqm-signup-section ${sectionClass}">
      <div class="iqm-signup-shell">
        <div class="iqm-signup-card iqm-signup-card--embed">
          <div class="iqm-signup-copy">
            <span class="iqm-signup-eyebrow">${eyebrow}</span>
            <h2 class="iqm-signup-title">${title}</h2>
            <p class="iqm-signup-text">${text}</p>
            <div class="iqm-signup-actions">
              ${buildSignupButton(buttonLabel)}
              <span class="iqm-signup-meta">Prefer the hosted version? Use the button to open the full signup page in a new tab.</span>
            </div>
          </div>
          ${buildSignupIframe(frameTitle)}
        </div>
      </div>
    </section>
  `
}

function buildSignupCompactSection({
  sectionClass = "",
  eyebrow,
  title,
  text,
  buttonLabel,
}) {
  return `
    <section class="iqm-signup-section iqm-signup-section--contained ${sectionClass}">
      <div class="iqm-signup-shell iqm-signup-shell--narrow">
        <div class="iqm-signup-card iqm-signup-card--compact">
          <div class="iqm-signup-copy">
            <span class="iqm-signup-eyebrow">${eyebrow}</span>
            <h2 class="iqm-signup-title">${title}</h2>
            <p class="iqm-signup-text">${text}</p>
          </div>
          <div class="iqm-signup-actions">
            ${buildSignupButton(buttonLabel)}
            <span class="iqm-signup-meta">Opens the hosted signup form in a new tab.</span>
          </div>
        </div>
      </div>
    </section>
  `
}

function buildSignupSidebarCard({ eyebrow, title, text, buttonLabel }) {
  return `
    <div class="iqm-signup-card iqm-signup-card--sidebar">
      <div class="iqm-signup-copy">
        <span class="iqm-signup-eyebrow">${eyebrow}</span>
        <h2 class="iqm-signup-title">${title}</h2>
        <p class="iqm-signup-text">${text}</p>
      </div>
      <div class="iqm-signup-actions iqm-signup-actions--sidebar">
        ${buildSignupButton(buttonLabel, "iqm-signup-button")}
      </div>
    </div>
  `
}

// Inject signup surfaces centrally so page type controls placement and weight.
function injectSignupPrompts() {
  const footer = document.querySelector("footer.site-footer")

  if (
    document.body.classList.contains("blog") &&
    document.querySelector(".bl-article-body") &&
    document.querySelector(".bl-article-sidebar")
  ) {
    const sidebar = document.querySelector(".bl-article-sidebar")
    if (sidebar && !sidebar.querySelector(".iqm-signup-card--sidebar")) {
      sidebar.insertAdjacentHTML(
        "beforeend",
        buildSignupSidebarCard({
          eyebrow: "Stay updated",
          title: "Get new essays and research notes",
          text:
            "Subscribe for intelligence training content, protocol updates, and occasional offers from IQMindware.",
          buttonLabel: "Subscribe for content",
        })
      )
    }
  }

  if (document.body.classList.contains("proof")) {
    const anchor = footer
    if (anchor && !document.querySelector(".iqm-signup-section--proof")) {
      anchor.insertAdjacentHTML(
        "beforebegin",
        buildSignupEmbedSection({
          sectionClass: "iqm-signup-section--proof",
          eyebrow: "Stay current",
          title: "Get protocol and proof updates by email",
          text:
            "Subscribe for new validation notes, protocol revisions, data summary updates, and launch offers.",
          frameTitle: "IQMindware proof signup form",
          buttonLabel: "Open hosted signup form",
        })
      )
    }
  }

  if (document.body.classList.contains("validation-detail")) {
    const anchor = document.querySelector(".gtv-cta-band") || footer
    if (anchor && !document.querySelector(".iqm-signup-section--validation")) {
      anchor.insertAdjacentHTML(
        "afterend",
        buildSignupCompactSection({
          sectionClass: "iqm-signup-section--validation",
          eyebrow: "Research updates",
          title: "Want protocol notes and new validation updates by email?",
          text:
            "Use the hosted signup form to get new protocol releases, research notes, and launch offers.",
          buttonLabel: "Subscribe for updates",
        })
      )
    }
  }
}

function injectRichSchema() {
  const existingTypes = schemaTypesInPage()
  const path = normalizePath(window.location.pathname)
  const graph = []

  function pushNode(node) {
    const compacted = compactValue(node)
    if (!compacted) return
    graph.push(compacted)
  }

  if (!existingTypes.has("Organization")) {
    pushNode(buildOrganizationSchema())
  }

  if (!existingTypes.has("WebSite")) {
    pushNode(buildWebSiteSchema())
  }

  if (!existingTypes.has("BreadcrumbList")) {
    pushNode(buildBreadcrumbSchema())
  }

  if (!existingTypes.has(pageSchemaType(path))) {
    pushNode(buildWebPageSchema(buildContactPageMainEntity(path)))
  }

  if (path === "/about/" && !existingTypes.has("Person")) {
    pushNode(buildMarkPersonSchema(false))
  }

  if (path === "/contact/" && !existingTypes.has("Person")) {
    pushNode(buildMarkPersonSchema(true))
  }

  if (!existingTypes.has("FAQPage")) {
    pushNode(buildFaqPageSchema())
    pushNode(buildSupportFaqSchema())
  }

  if (!existingTypes.has("SoftwareApplication")) {
    pushNode(buildToolSchema())
  }

  if (!existingTypes.has("OfferCatalog")) {
    pushNode(buildPricingCatalogSchema())
  }

  if (!existingTypes.has("Service")) {
    pushNode(buildCoachingServiceSchema())
  }

  if (!existingTypes.has("ItemList")) {
    pushNode(buildProofProtocolListSchema())
  }

  if (
    (!existingTypes.has("Blog") &&
      document.body.classList.contains("blog") &&
      document.querySelector(".bl-grid")) ||
    (!existingTypes.has("ItemList") &&
      (document.body.classList.contains("tools") ||
        (document.body.classList.contains("wiki") &&
          document.querySelector(".wk-index")) ||
        (document.body.classList.contains("learn") &&
          document.querySelector(".lh-hub-card"))))
  ) {
    pushNode(buildLearnHubSchemas())
  }

  if (!graph.length) return

  const script = document.createElement("script")
  script.type = "application/ld+json"
  script.dataset.schemaSource = "iqmindware-app"
  script.textContent = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": graph,
    },
    null,
    0
  ).replace(/</g, "\\u003c")

  document.head.appendChild(script)
}

highlightCurrentNav()
injectSignupPrompts()
injectRichSchema()
renderPricing()
renderCadence()

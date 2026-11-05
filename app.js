"use strict";

const listings = [
  {
    id: "presnya", district: "Пресненский", title: "Квартира с панорамными окнами",
    price: 28900000, rooms: 3, area: 82, floor: "12 из 25",
    description: "Гостиная с окнами в пол, две спальни и отдельная гардеробная. Окна гостиной выходят на город.",
  },
  {
    id: "khamovniki", district: "Хамовники", title: "Двухкомнатная с кухней-гостиной",
    price: 18700000, rooms: 2, area: 56, floor: "7 из 14",
    description: "Кухня-гостиная с обеденной зоной, отдельная спальня и место для рабочего стола у окна.",
  },
  {
    id: "sokolniki", district: "Сокольники", title: "Светлая однокомнатная",
    price: 11900000, rooms: 1, area: 37, floor: "9 из 17",
    description: "Отдельная кухня, просторная спальня и ниша под шкаф в прихожей.",
  },
  {
    id: "ramenki", district: "Раменки", title: "Квартира с отдельной гостиной",
    price: 12900000, rooms: 2, area: 58, floor: "6 из 16",
    description: "Кухня с обеденной зоной, отдельная спальня и гостиная с большими окнами.",
  },
];

const filters = document.querySelector("#filters");
const catalog = document.querySelector("#catalog");
const catalogTitle = document.querySelector("#catalog-title");
const filterReset = document.querySelector(".catalog-meta [data-reset]");
const listingGrid = document.querySelector("#listing-grid");
const listingDialog = document.querySelector("#listing-dialog");
const bookingDialog = document.querySelector("#booking-dialog");
const bookingForm = document.querySelector("#booking-form");
const bookingSuccess = document.querySelector("#booking-success");
const shareStatus = document.querySelector("#share-status");
const money = new Intl.NumberFormat("ru-RU");
const plural = new Intl.PluralRules("ru-RU");
const listingUnits = { one: "вариант", few: "варианта", many: "вариантов" };
let activeListing = null;

function priceText(price) {
  return money.format(price) + " ₽";
}

function roomText(rooms) {
  return rooms === 1 ? "1 комната" : rooms + " комнаты";
}

function imagePath(listing) {
  return "assets/" + listing.id + ".webp";
}

function renderCatalog() {
  const { district, budget, rooms } = Object.fromEntries(new FormData(filters));
  const matching = listings.filter((listing) =>
    (!district || listing.district === district) &&
    (!budget || listing.price <= Number(budget)) &&
    (!rooms || listing.rooms === Number(rooms))
  );
  // Only fixed catalogue entries are interpolated into the markup.
  listingGrid.innerHTML = matching.map((listing) => `
    <a class="listing" href="#kv-${listing.id}" aria-label="${listing.title}, ${priceText(listing.price)}">
      <div class="listing-photo">
        <img src="${imagePath(listing)}" loading="lazy" alt="" width="762" height="506">
      </div>
      <div class="listing-content">
        <p class="listing-district">${listing.district}</p>
        <h3>${listing.title}</h3>
        <p class="listing-specs">${roomText(listing.rooms)} · ${listing.area} м²</p>
        <div class="listing-bottom">
          <span class="listing-price">${priceText(listing.price)}</span>
          <span class="listing-arrow"><svg aria-hidden="true"><use href="#icon-arrow"/></svg></span>
        </div>
      </div>
    </a>
  `).join("");
  const count = matching.length;
  document.querySelector("#result-count").textContent = count + " " + listingUnits[plural.select(count)];
  document.querySelector("#empty-state").hidden = count > 0;
  filterReset.hidden = !(district || budget || rooms) || count === 0;
}

function syncListing() {
  const listing = listings.find((item) => "#kv-" + item.id === window.location.hash);
  if (!listing) {
    if (listingDialog.open && bookingDialog.open) bookingDialog.close();
    if (listingDialog.open) listingDialog.close();
    activeListing = null;
    return;
  }
  if (activeListing?.id !== listing.id && listingDialog.open && bookingDialog.open) {
    bookingDialog.close();
  }
  activeListing = listing;
  const photo = document.querySelector("#detail-photo");
  photo.src = imagePath(listing);
  photo.alt = "Интерьер квартиры из демонстрационного объявления";
  document.querySelector("#detail-title").textContent = listing.title;
  document.querySelector("#detail-location").textContent = "Москва · " + listing.district;
  document.querySelector("#detail-price").textContent = priceText(listing.price);
  document.querySelector("#detail-description").textContent = listing.description;
  const facts = [roomText(listing.rooms), listing.area + " м²", "Этаж " + listing.floor];
  document.querySelector("#detail-facts").replaceChildren(...facts.map((fact) => {
    const item = document.createElement("li");
    item.textContent = fact;
    return item;
  }));
  shareStatus.textContent = "";
  if (!listingDialog.open) listingDialog.showModal();
  listingDialog.scrollTop = 0;
}

function openBooking(listing) {
  bookingForm.reset();
  bookingForm.hidden = false;
  bookingSuccess.hidden = true;
  document.querySelector("#booking-context").textContent =
    listing.district + " · " + roomText(listing.rooms) + " · " + priceText(listing.price);
  bookingDialog.showModal();
  bookingDialog.scrollTop = 0;
}

filters.addEventListener("submit", (event) => {
  event.preventDefault();
  renderCatalog();
  catalogTitle.focus({ preventScroll: true });
  catalog.scrollIntoView({ block: "start" });
});
document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", () => {
    filters.reset();
    renderCatalog();
    catalogTitle.focus();
  });
});
document.querySelector("#book-listing").addEventListener("click", () => openBooking(activeListing));
document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});
listingDialog.addEventListener("close", () => {
  if (listingDialog.open || !window.location.hash.startsWith("#kv-")) return;
  history.replaceState(null, "", "#catalog");
  activeListing = null;
  if (document.activeElement === document.body) catalog.scrollIntoView({ block: "start" });
});
document.querySelector("#share-listing").addEventListener("click", async () => {
  const link = window.location.href;
  try {
    await navigator.clipboard.writeText(link);
    if (window.location.href === link) shareStatus.textContent = "Ссылка скопирована";
  } catch {
    if (window.location.href === link) shareStatus.textContent = link;
  }
});
bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  bookingForm.reset();
  bookingForm.hidden = true;
  bookingSuccess.hidden = false;
  bookingSuccess.querySelector("button").focus();
});
window.addEventListener("hashchange", syncListing);
renderCatalog();
syncListing();

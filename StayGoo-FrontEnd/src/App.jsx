import { useEffect, useRef, useState, createElement } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./App.css";
import { es, enUS } from "date-fns/locale";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { Umbrella, House, Building2, Waves, Castle, Gem, Landmark, Search, UserRound, Heart } from "lucide-react";
import footerImage from "./assets/footer.jpg";
import logoImage from "./assets/logoo.png";
import { useAppLogic } from "./appLogic";
import {
  getFavoriteIds,
  toggleFavoriteId,
  isFavorite,
  FAVORITES_CHANGED_EVENT,
} from "./utils/favoritesStorage";

registerLocale("es", es);
registerLocale("en", enUS);

function App() {
  const navigate = useNavigate();
  const [isSessionActive] = useState(() => {
    try {
      return window.localStorage.getItem("staygooSession") === "true";
    } catch {
      return false;
    }
  });
  const [favorites, setFavorites] = useState(getFavoriteIds);

  useEffect(() => {
    const syncFavorites = () => setFavorites(getFavoriteIds());
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);
  const [isNavbarFloating, setIsNavbarFloating] = useState(false);
  const [isFilterDocked, setIsFilterDocked] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const heroSearchAnchorRef = useRef(null);
  const resultsAnchorRef = useRef(null);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;
      const anchorTop = heroSearchAnchorRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;

      setIsNavbarFloating(currentScrollY > 0);
      setIsFilterDocked((prev) => {
        if (currentScrollY === 0 || window.innerWidth <= 1120) return false;
        if (isScrollingDown && anchorTop <= 118) return true;
        if (!isScrollingDown && anchorTop > 118) return false;
        return prev;
      });

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleSearchWithScroll = () => {
    applyHeroFilters();
    setTimeout(() => {
      resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSearchEnterKey = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchWithScroll();
    }
  };

  const handleLoginClick = () => {
    setIsHamburgerOpen(false);
    navigate("/login");
  };

  const handleSignUpClick = () => {
    setIsHamburgerOpen(false);
    navigate("/register");
  };

  const handleProfileClick = () => {
    setIsHamburgerOpen(false);
    const accessRole = window.localStorage.getItem("staygooAccessRole");
    navigate(accessRole === "host" ? "/host-dashboard" : "/member-dashboard");
  };

  const handleExploreClick = () => {
    setIsHamburgerOpen(false);
    resultsAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFavorite = (listingId, e) => {
    e.stopPropagation();
    try {
      const updated = toggleFavoriteId(listingId);
      setFavorites(updated);
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  };

  const {
    activeCategoryIndex,
    heroFilters,
    filterError,
    listingsError,
    t,
    categories,
    guestOptions,
    selectedGuestOption,
    guestSelectStyles,
    featuredListings,
    additionalListings,
    handleHeroFilterChange,
    handleCategoryClick,
    openListingDetails,
    applyHeroFilters
  } = useAppLogic();


  const categoryIcons = [Umbrella, House, Building2, Waves, Castle, Gem, Landmark];

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className={`navbar navbarOverlay ${isNavbarFloating ? "navbarFloating" : ""} ${isFilterDocked ? "navbarWithDockedFilter" : ""}`}>
        <div className="logoContainer">
          <img src={logoImage} alt="stayGoo" className="logoImg" />
        </div>

        <div className={`navHeroSearch ${isFilterDocked ? "isVisible" : ""}`} aria-hidden={!isFilterDocked}>
          <div className="searchBlock navSearchBlock">
            <label>{t.hero.whereTo}</label>
            <input
              className="heroField"
              type="text"
              placeholder={t.hero.destination}
              value={heroFilters.destination}
              onChange={(e) => handleHeroFilterChange("destination", e.target.value)}
              onKeyDown={handleSearchEnterKey}
            />
          </div>
          <div className="searchBlock navSearchBlock">
            <label>{t.hero.checkIn}</label>
            <DatePicker
              selected={heroFilters.checkIn}
              onChange={(date) => handleHeroFilterChange("checkIn", date)}
              selectsStart
              startDate={heroFilters.checkIn}
              endDate={heroFilters.checkOut}
              minDate={new Date()}
              maxDate={heroFilters.checkOut || undefined}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="heroField heroDatePicker"
              calendarClassName="heroDateCalendar"
              popperClassName="heroDatePopper"
              placeholderText={t.hero.datePlaceholder}
            />
          </div>
          <div className="searchBlock navSearchBlock">
            <label>{t.hero.checkOut}</label>
            <DatePicker
              selected={heroFilters.checkOut}
              onChange={(date) => handleHeroFilterChange("checkOut", date)}
              selectsEnd
              startDate={heroFilters.checkIn}
              endDate={heroFilters.checkOut}
              minDate={heroFilters.checkIn || new Date()}
              locale="es"
              dateFormat="dd/MM/yyyy"
              className="heroField heroDatePicker"
              calendarClassName="heroDateCalendar"
              popperClassName="heroDatePopper"
              placeholderText={t.hero.datePlaceholder}
            />
          </div>
          <div className="searchBlock navSearchBlock navSearchGuestBlock">
            <label>{t.hero.guests}</label>
            <Select
              className="heroGuestReactSelect heroGuestReactSelectEs"
              classNamePrefix="guestSelect"
              placeholder={t.hero.addGuests}
              options={guestOptions}
              value={selectedGuestOption}
              onChange={(option) => handleHeroFilterChange("guests", option ? option.value : "")}
              styles={guestSelectStyles}
              isClearable
              openMenuOnFocus
              maxMenuHeight={220}
            />
          </div>
          <button className="searchBtn navSearchBtn" onClick={handleSearchWithScroll} aria-label={t.hero.searchBtn}>
            <Search className="searchBtnIcon" size={18} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>

        <div className="navButtons">
          <button className="explore" onClick={handleExploreClick}>{t.navbar.explore}</button>
          {isSessionActive ? (
            <button className="userIconBtn" onClick={handleProfileClick} aria-label="Abrir perfil">
              <UserRound size={22} strokeWidth={1.9} aria-hidden="true" />
            </button>
          ) : (
            <>
              <button className="ghost" onClick={handleLoginClick}>{t.navbar.login}</button>
              <button className="outline" onClick={handleSignUpClick}>{t.navbar.signUp}</button>
            </>
          )}
        </div>

        <div className={`navHamburgerWrap ${isFilterDocked ? "isVisible" : ""}`}>
          <button
            className={`navHamburgerBtn ${isFilterDocked && isHamburgerOpen ? "isOpen" : ""}`}
            onClick={() => setIsHamburgerOpen((prev) => (isFilterDocked ? !prev : false))}
            aria-label="Open navigation menu"
            aria-expanded={isFilterDocked && isHamburgerOpen}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>

          {isFilterDocked && isHamburgerOpen ? (
            <div className="navHamburgerMenu">
              <button className="hamburgerMenuItem hamburgerMenuItemPrimary" onClick={handleExploreClick}>{t.navbar.explore}</button>
              {isSessionActive ? (
                <button className="hamburgerMenuItem hamburgerMenuItemOutline" onClick={handleProfileClick}>
                  <UserRound size={16} aria-hidden="true" />
                  {t.navbar.profile}
                </button>
              ) : (
                <>
                  <button className="hamburgerMenuItem" onClick={handleLoginClick}>{t.navbar.login}</button>
                  <button className="hamburgerMenuItem hamburgerMenuItemOutline" onClick={handleSignUpClick}>{t.navbar.signUp}</button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="heroInner">
          <span className="heroBadge">{t.hero.badge}</span>
          <h1 className="heroHeadline">
            {t.hero.headlineLine1}
            <br />
            {t.hero.headlinePrefix} <span className="heroHeadlineAccent">{t.hero.headlineAccent}</span> {t.hero.headlineSuffix}
          </h1>
          <p className="heroDescription">
            {t.hero.description}
          </p>

          <div ref={heroSearchAnchorRef} aria-hidden="true" />
          <div className={`heroSearch ${isFilterDocked ? "isHidden" : ""}`}>
            <div className="searchBlock">
              <label>{t.hero.whereTo}</label>
              <input
                className="heroField"
                type="text"
                placeholder={t.hero.destination}
                value={heroFilters.destination}
                onChange={(e) => handleHeroFilterChange("destination", e.target.value)}
                onKeyDown={handleSearchEnterKey}
              />
            </div>
            <div className="searchBlock">
              <label>{t.hero.checkIn}</label>
              <DatePicker
                selected={heroFilters.checkIn}
                onChange={(date) => handleHeroFilterChange("checkIn", date)}
                selectsStart
                startDate={heroFilters.checkIn}
                endDate={heroFilters.checkOut}
                minDate={new Date()}
                maxDate={heroFilters.checkOut || undefined}
                locale="es"
                dateFormat="dd/MM/yyyy"
                className="heroField heroDatePicker"
                calendarClassName="heroDateCalendar"
                popperClassName="heroDatePopper"
                placeholderText={t.hero.datePlaceholder}
              />
            </div>
            <div className="searchBlock">
              <label>{t.hero.checkOut}</label>
              <DatePicker
                selected={heroFilters.checkOut}
                onChange={(date) => handleHeroFilterChange("checkOut", date)}
                selectsEnd
                startDate={heroFilters.checkIn}
                endDate={heroFilters.checkOut}
                minDate={heroFilters.checkIn || new Date()}
                locale="es"
                dateFormat="dd/MM/yyyy"
                className="heroField heroDatePicker"
                calendarClassName="heroDateCalendar"
                popperClassName="heroDatePopper"
                placeholderText={t.hero.datePlaceholder}
              />
            </div>
            <div className="searchBlock">
              <label>{t.hero.guests}</label>
              <Select
                className="heroGuestReactSelect heroGuestReactSelectEs"
                classNamePrefix="guestSelect"
                placeholder={t.hero.addGuests}
                options={guestOptions}
                value={selectedGuestOption}
                onChange={(option) => handleHeroFilterChange("guests", option ? option.value : "")}
                styles={guestSelectStyles}
                isClearable
                openMenuOnFocus
                maxMenuHeight={220}
              />
            </div>
            <button className="searchBtn" onClick={handleSearchWithScroll}>
              <span className="searchBtnIcon" aria-hidden="true">⌕</span>
              <span>{t.hero.searchBtn}</span>
            </button>
          </div>

          <div className="heroScrollHint" aria-hidden="true">{t.hero.scrollHint}</div>
        </div>
      </div>

      {/* LISTINGS */}
      {/* CATEGORIES */}
      <div className="categories" ref={resultsAnchorRef}>
        {categories.map((cat, index) => (
          <button
            key={index}
            className={`category ${activeCategoryIndex === index ? "active" : ""}`}
            onClick={() => handleCategoryClick(index)}
          >
            <span className="categoryInner">
              <span className="categoryEmoji" aria-hidden="true">{categoryIcons[index] && createElement(categoryIcons[index], { size: 29, strokeWidth: 1.8, absoluteStrokeWidth: true })}</span>
              <span>{cat}</span>
            </span>
          </button>
        ))}
      </div>
      {filterError ? <p className="filterError">{filterError}</p> : null}
      {listingsError ? <p className="filterError">{listingsError}</p> : null}

      {featuredListings.length > 0 ? (
        <>
          <div className="sectionTitle">
            {t.listings.featuredAccommodations}
          </div>

          <div className="grid">
            {featuredListings.map(place => (
              <div key={place.id} className="card" onClick={() => openListingDetails(place)}>
                <div className="cardImageWrapper" style={{ position: "relative" }}>
                  <img src={place.image} alt="" className="cardImage" />
                  <button
                    className="cardFavorite"
                    onClick={(e) => toggleFavorite(place.id, e)}
                    aria-label="Toggle favorite"
                    type="button"
                  >
                    <Heart
                      size={18}
                      fill={isFavorite(place.id) ? "currentColor" : "none"}
                      color={isFavorite(place.id) ? "#ff815f" : "currentColor"}
                      strokeWidth={2}
                    />
                  </button>
                  <div className="cardOverlay" />
                </div>
                <div className="cardContent">
                  <div className="cardTitle">
                    {place.title}
                  </div>
                  <div className="cardLocation">
                    {place.location} · {place.maxGuests}p
                  </div>
                  <div className="cardFooter">
                    <span className="price">
                      {place.price}
                    </span>
                    <span className="rating">
                      ⭐ {place.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {additionalListings.length > 0 ? (
        <>
          <div className="sectionTitle">
            {t.listings.additionalStays}
          </div>

          <div className="grid">
            {additionalListings.map(place => (
              <div key={place.id} className="card" onClick={() => openListingDetails(place)}>
                <div className="cardImageWrapper" style={{ position: "relative" }}>
                  <img src={place.image} alt="" className="cardImage" />
                  <button
                    className="cardFavorite"
                    onClick={(e) => toggleFavorite(place.id, e)}
                    aria-label="Toggle favorite"
                    type="button"
                  >
                    <Heart
                      size={18}
                      fill={isFavorite(place.id) ? "currentColor" : "none"}
                      color={isFavorite(place.id) ? "#ff815f" : "currentColor"}
                      strokeWidth={2}
                    />
                  </button>
                  <div className="cardOverlay" />
                </div>
                <div className="cardContent">
                  <div className="cardTitle">
                    {place.title}
                  </div>
                  <div className="cardLocation">
                    {place.location} · {place.maxGuests}p
                  </div>
                  <div className="cardFooter">
                    <span className="price">
                      {place.price}
                    </span>
                    <span className="rating">
                      ⭐ {place.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {featuredListings.length + additionalListings.length === 0 ? (
        <p className="noResults">{t.listings.noResults}</p>
      ) : null}

      <footer className="footer">
        <div className="footerAtmosphere" aria-hidden="true">
          <img src={footerImage} alt="" className="footerAtmosphereImage" />
          <div className="footerAtmosphereFade" />
        </div>

        <div className="footerMain">
          <div className="footerBrand">
            <img src={logoImage} alt="stayGoo" className="footerLogo" />
          </div>

          <p className="footerStatement">{t.footer.description}</p>
        </div>

        <div className="footerBottom">
          <span>{`${t.footer.brandHandle} · ${t.footer.rights} · ${t.footer.visualCredit}`}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

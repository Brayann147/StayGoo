import { useMemo, useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import DualLoader from "./components/DualLoader";
import {
  CircleDollarSign,
  LayoutDashboard,
  Building2,
  CalendarDays,
  Wallet,
  MessageSquare,
  Settings,
  LifeBuoy,
  Plus,
  MoreVertical,
  Sparkles,
  ChevronDown,
  Wifi,
  Waves,
  Car,
  Snowflake,
  Flame,
  CookingPot,
  PlusCircle,
  Upload,
  CheckCircle2,
  MapPin,
  Star,
  Trash2,
  Bell,
  House,
  MoreHorizontal,
  Backpack,
  Mail,
  Phone
} from "lucide-react";

import { MessagesSection } from "./components/MessagesSection";
import EquirectangularUploader from "./components/EquirectangularUploader";
import { SettingsSection } from "./components/SettingsSection";
import logoImage from "./assets/logoo.png";
import { createHousing, getHousings, updateHousing, getHostBookings, getMyProfile, uploadHousingImage, deleteHousingImage, fetchDepartmentsByCountry, fetchCitiesByDepartment } from "./api";
import { useAuthUser } from "./useAuthUser";
import { GoogleMapPicker } from "./components/GoogleMapPicker";
import "./HostDashboardPage.css";

const sidebarItems = [
  { id: "dashboard", label: "Panel", icon: LayoutDashboard },
  { id: "listings", label: "Alojamientos", icon: Building2 },
  { id: "reservations", label: "Reservas", icon: CalendarDays },
  { id: "earnings", label: "Ingresos", icon: Wallet },
  { id: "messages", label: "Mensajes", icon: MessageSquare },
];

const COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "BO", name: "Bolivia" },
  { code: "BR", name: "Brasil" },
  { code: "CA", name: "Canadá" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "CU", name: "El Salvador" }, // Simplified list
  { code: "EC", name: "Ecuador" },
  { code: "SV", name: "El Salvador" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "MX", name: "México" },
  { code: "NI", name: "Nicaragua" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Panamá" },
  { code: "PE", name: "Paraguay" },
  { code: "PR", name: "Puerto Rico" },
  { code: "DO", name: "Puerto Rico" },
  { code: "UY", name: "Uruguay" },
  { code: "VE", name: "Venezuela" },
];

function HostDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthUser();
  const displayName = (typeof user?.name === "string" && !user.name.includes("undefined")) ? user.name : "Anfitrión";
  const isSpanish = true;
  const [activeItem, setActiveItem] = useState("dashboard");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [listingAction, setListingAction] = useState(null);

  const [editListingForm, setEditListingForm] = useState({
    title: "The Glass Pavilion",
    propertyType: "architectural-home",
    description:
      "An award-winning glass and steel structure nestled in the redwood forests. Floor-to-ceiling transparency meets absolute seclusion for a truly immersive nature experience.",
    address: "1224 Redwood Hollow Trail",
    cityRegion: "Big Sur",
    department: "",
    country: "United States",
    visibility: "Approximate location shown to public",
    basePrice: "850",
    weeklyDiscount: "15",
    cleaningFee: "120",
    latitude: "",
    longitude: "",
    amenities: {
      wifi: true,
      pool: false,
      parking: true,
      aircon: false,
      fireplace: true,
      kitchen: true,
    }
  });
  const [newListingForm, setNewListingForm] = useState({
    title: "",
    propertyType: "",
    description: "",
    address: "",
    cityRegion: "",
    department: "",
    country: "",
    visibility: "Approximate location shown to public",
    basePrice: "",
    weeklyDiscount: "",
    cleaningFee: "",
    latitude: "",
    longitude: "",
    amenities: {
      wifi: false,
      pool: false,
      parking: false,
      aircon: false,
      fireplace: false,
      kitchen: false,
    }
  });
  const [editListingPhotos, setEditListingPhotos] = useState([
    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"
  ]);
  const [newListingPhotos, setNewListingPhotos] = useState([]);
  const [newListingPanoramaPhotos, setNewListingPanoramaPhotos] = useState([]);
  const [editListingPanoramaPhotos, setEditListingPanoramaPhotos] = useState([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState([]);


  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Fetch departments when country changes
  useEffect(() => {
    if (listingAction === "edit" || listingAction === "new") {
      const form = listingAction === "edit" ? editListingForm : newListingForm;
      const currentCountry = form.country;

      const selectedCountryObj = COUNTRIES.find(c => c.name === currentCountry);
      if (selectedCountryObj) {
        setLoadingDepartments(true);
        fetchDepartmentsByCountry(selectedCountryObj.code)
          .then(deps => {
            setAvailableDepartments(deps || []);
            // Also reset cities when country changes
            setAvailableCities([]);
          })
          .catch(err => {
            console.error("Error fetching departments", err);
            setAvailableDepartments([]);
            setAvailableCities([]);
          })
          .finally(() => {
            setLoadingDepartments(false);
          });
      } else {
        setAvailableDepartments([]);
        setAvailableCities([]);
      }
    }
  }, [editListingForm.country, newListingForm.country, listingAction]);

  // Fetch cities when department changes
  useEffect(() => {
    if (listingAction === "edit" || listingAction === "new") {
      const form = listingAction === "edit" ? editListingForm : newListingForm;
      const currentCountry = form.country;
      const currentDeptName = form.department;

      const selectedCountryObj = COUNTRIES.find(c => c.name === currentCountry);
      const selectedDeptObj = availableDepartments.find(d => d.name === currentDeptName);

      if (selectedCountryObj && selectedDeptObj) {
        setLoadingCities(true);
        fetchCitiesByDepartment(selectedCountryObj.code, selectedDeptObj.adminCode1)
          .then(cities => {
            setAvailableCities(cities || []);
          })
          .catch(err => {
            console.error("Error fetching cities", err);
            setAvailableCities([]);
          })
          .finally(() => {
            setLoadingCities(false);
          });
      } else {
        setAvailableCities([]);
      }
    }
  }, [editListingForm.department, newListingForm.department, listingAction, availableDepartments]);
  const [selectedReservationListingId, setSelectedReservationListingId] = useState("lst-1");
  const [reservationViewDate, setReservationViewDate] = useState(new Date(2024, 9, 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("2024-10-01");
  const [hostPhoto, setHostPhoto] = useState(
  localStorage.getItem('staygooProfilePhoto') || 
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=180&q=80"
);
  const [selectedMessageGuestName, setSelectedMessageGuestName] = useState(null);
  const [earningsView, setEarningsView] = useState("monthly");
  const [selectedEarningsListing, setSelectedEarningsListing] = useState(null);
  const [showEarningsDropdown, setShowEarningsDropdown] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    details: "",
    contactName: "Julian Rossi",
  });
  const [supportStatus, setSupportStatus] = useState("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [transactionsData, setTransactionsData] = useState([]);
  const [earningsData, setEarningsData] = useState({
    monthly: { totalAmount: "$0.00", change: "0%", chartBars: [], chartLabels: [], activeBarIndex: 0, nextPayout: "$0.00", nextPayoutDate: "-", payoutProgress: 0 },
    yearly: { totalAmount: "$0.00", change: "0%", chartBars: [], chartLabels: [], activeBarIndex: 0, nextPayout: "$0.00", nextPayoutDate: "-", payoutProgress: 0 },
  });

  const dropdownRef = useRef(null);
  const newListingCoverPhotoRef = useRef(null);
  const editListingCoverPhotoRef = useRef(null);
  const newListingPanoramaPhotosRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEarningsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const currentEarningsData = earningsData[earningsView];

  // Filter transactions based on selected listing
  const filteredTransactions = selectedEarningsListing
    ? transactionsData.filter(txn => txn.listingId === selectedEarningsListing)
    : transactionsData;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(47, 111, 178);
    doc.text("REPORTE DE INGRESOS", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Date and View Info
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    const dateStr = now.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
    doc.text(`Generated: ${dateStr}`, 20, yPosition);
    yPosition += 8;

    doc.text(`Período: ${earningsView === "monthly" ? "Mensual" : "Anual"}`, 20, yPosition);
    yPosition += 8;

    if (selectedEarningsListing) {
      const selectedListing = registeredListings.find(l => l.id === selectedEarningsListing);
      doc.text(`Alojamiento: ${selectedListing?.title || "Desconocido"}`, 20, yPosition);
    } else {
      doc.text("Alojamiento: Todos los alojamientos", 20, yPosition);
    }
    yPosition += 15;

    // Earnings Summary Section
    doc.setFontSize(14);
    doc.setTextColor(47, 111, 178);
    doc.text("RESUMEN DE INGRESOS", 20, yPosition);
    yPosition += 12;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Ingresos totales:", 20, yPosition);
    doc.setFont(undefined, "bold");
    doc.text(currentEarningsData.totalAmount, 80, yPosition);
    yPosition += 8;

    doc.setFont(undefined, "normal");
    doc.text("Cambio:", 20, yPosition);
    doc.setFont(undefined, "bold");
    doc.text(currentEarningsData.change, 80, yPosition);
    yPosition += 8;

    doc.setFont(undefined, "normal");
    doc.text("Próximo pago:", 20, yPosition);
    doc.setFont(undefined, "bold");
    doc.text(currentEarningsData.nextPayout, 80, yPosition);
    yPosition += 8;

    doc.setFont(undefined, "normal");
    doc.text("Fecha prevista:", 20, yPosition);
    doc.setFont(undefined, "bold");
    doc.text(currentEarningsData.nextPayoutDate, 80, yPosition);
    yPosition += 15;

    // Transactions Section
    doc.setFontSize(14);
    doc.setTextColor(47, 111, 178);
    doc.text("TRANSACCIONES RECIENTES", 20, yPosition);
    yPosition += 12;

    // Table Headers
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(47, 111, 178);

    const headers = ["HUÉSPED", "FECHAS", "NOCHES", "ALOJAMIENTO", "INGRESOS", "ESTADO"];
    const columnWidths = [35, 25, 18, 50, 25, 20];
    let xPosition = 20;

    headers.forEach((header, i) => {
      doc.rect(xPosition, yPosition - 6, columnWidths[i], 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.text(header, xPosition + 2, yPosition, { fontSize: 10 });
      xPosition += columnWidths[i];
    });

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");

    // Table Rows
    filteredTransactions.forEach((txn) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      const rowHeight = 8;

      // GUEST
      doc.text(txn.guest.substring(0, 20), xPosition + 1, yPosition, { maxWidth: columnWidths[0] - 2, fontSize: 9 });
      xPosition += columnWidths[0];

      // DATES
      doc.text(txn.dateRange.substring(0, 15), xPosition + 1, yPosition, { maxWidth: columnWidths[1] - 2, fontSize: 9 });
      xPosition += columnWidths[1];

      // NIGHTS
      doc.text(`${txn.nights}`, xPosition + 1, yPosition, { fontSize: 9 });
      xPosition += columnWidths[2];

      // LISTING
      doc.text(txn.listingName.substring(0, 22), xPosition + 1, yPosition, { maxWidth: columnWidths[3] - 2, fontSize: 9 });
      xPosition += columnWidths[3];

      // EARNINGS
      doc.text(txn.earnings, xPosition + 1, yPosition, { maxWidth: columnWidths[4] - 2, fontSize: 9 });
      xPosition += columnWidths[4];

      // STATUS
      doc.text(txn.status, xPosition + 1, yPosition, { fontSize: 9 });

      yPosition += rowHeight;
    });

    // Footer
    yPosition += 10;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("This report is confidential and for internal use only.", 20, yPosition);

    // Download
    const filename = `Earnings-Report-${earningsView}-${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(filename);
  };

  const [registeredListings, setRegisteredListings] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);

  const loadHousings = async () => {
    try {
      setIsProcessing(true);
      const userProfile = await getMyProfile();
      console.log("perfil completo:", userProfile);
      console.log("avatar:", userProfile?.avatar);
      const userId = userProfile?.id_user;

      const hostAvatar = userProfile?.avatar || localStorage.getItem('staygooProfilePhoto') || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=180&q=80";
    if (userProfile?.avatar) localStorage.setItem('staygooProfilePhoto', userProfile.avatar);

      const data = await getHousings();

      if (data && Array.isArray(data)) {
        const hostHousings = data.filter(item =>
          item.id_owner === userId ||
          (item.host && item.host.id_user === userId)
        );

        const mappedListings = hostHousings.map((item) => {
          const images = item.housing_images || [];
          const normalImages = images.filter(img => !img.is_panorama);
          const firstImage = normalImages.length > 0 ? normalImages[0].image_url : "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80";

          const cityParts = (item.municipality || item.cityRegion || "").split(",").map(p => p.trim());

          let parsedCityRegion = item.municipality || "";
          let parsedDepartment = item.department || "";
          let parsedCountry = item.country || "";

          if (!parsedDepartment && !parsedCountry) {
            if (cityParts.length >= 3) {
              parsedCityRegion = cityParts[0];
              parsedDepartment = cityParts[1];
              parsedCountry = cityParts.slice(2).join(",").trim();
            } else if (cityParts.length === 2) {
              parsedCityRegion = cityParts[0];
              parsedCountry = cityParts[1];
            } else if (cityParts.length === 1) {
              parsedCityRegion = cityParts[0];
            }
          }

          return {
            id: "lst-" + item.id_housing, // El Dashboard asume formato id como lst-1
            realId: item.id_housing,
            title: item.name || "Sin título",
            propertyType: item.type_housing ? item.type_housing.name : "architectural-home",
            description: item.description || "",
            address: item.address || "",
            cityRegion: parsedCityRegion,
            department: parsedDepartment,
            country: parsedCountry,
            visibility: "Approximate location",
            basePrice: item.price_per_night?.toString() || "0",
            weeklyDiscount: "0",
            cleaningFee: "0",
            latitude: item.latitude,
            longitude: item.longitude,
            amenities: {
              wifi: true,
              pool: false,
              parking: false,
              aircon: true,
              fireplace: false,
              kitchen: true,
            },
            coverImage: firstImage,
            housing_images: images,
            hostName: "Mi Alojamiento",
            hostAvatar: hostAvatar,
            status: item.status === "available" ? "Publicado" : "Borrador",
            rating: 4.8,
            reservations: 0,
          };
        });
        setRegisteredListings(mappedListings);
        if (listingAction === "edit" && editListingForm.id) {
          const refreshed = hostHousings.find(h => h.id_housing === editListingForm.id);
          if (refreshed) {
            const allImages = refreshed.housing_images || [];
            const normalImgs = allImages.filter(img => !img.is_panorama).map(img => ({
              src: img.image_url,
              name: img.image_url.split('/').pop() || "Foto guardada",
              id: img.id_image
            }));
            const panoImgs = allImages.filter(img => img.is_panorama).map(img => ({
              src: img.image_url,
              name: img.image_url.split('/').pop() || "Modelo 360 guardado",
              id: img.id_image
            }));
            setEditListingPhotos(normalImgs);
            setEditListingPanoramaPhotos(panoImgs);
          }
        }
      }

    } catch (err) {
      console.error("Error fetching housings:", err);
    }
    try {
      const bookingsData = await getHostBookings();
      if (bookingsData && Array.isArray(bookingsData)) {
        setHostBookings(bookingsData);

        // Build Reservations
        const dynamicReservations = bookingsData.map(b => {
          const start = b.start_date ? new Date(b.start_date) : new Date();
          const end = b.end_date ? new Date(b.end_date) : new Date();
          const startStr = start.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          const endStr = end.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

          return {
            id: b.id_booking,
            guest: b.user?.name || "Huésped",
            dates: `${startStr} - ${endStr}`,
            listing: b.housing?.name || "Alojamiento",
            status: b.status === "confirmed" ? "confirmed" : "pending",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
          };
        });
        setReservations(dynamicReservations);

        // Build Transactions
        const dynamicTransactions = bookingsData.map(b => {
          const start = b.start_date ? new Date(b.start_date) : new Date();
          const end = b.end_date ? new Date(b.end_date) : new Date();
          const startStr = start.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          const endStr = end.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

          return {
            id: `txn-${b.id_booking}`,
            listingId: `lst-${b.id_housing}`,
            guest: b.user?.name || "Huésped",
            guestAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
            bookingId: `BK-${b.id_booking}`,
            dateRange: `${startStr} - ${endStr}`,
            nights,
            listingName: b.housing?.name || "Alojamiento",
            listingType: "Alojamiento",
            earnings: `$${Number(b.total_price || 0).toLocaleString()}`,
            status: b.status === "confirmed" ? "PAID" : "PENDING"
          };
        });
        setTransactionsData(dynamicTransactions);

        // Build Earnings
        const totalEarnings = bookingsData.reduce((acc, b) => acc + Number(b.total_price || 0), 0);
        setEarningsData({
          monthly: {
            totalAmount: `$${totalEarnings.toLocaleString()}`,
            change: "↗ +0% this month",
            chartBars: [10, 20, 30, 40, 50, 60, 70, 80],
            chartLabels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"],
            activeBarIndex: 6,
            nextPayout: "-",
            nextPayoutDate: "No data",
            payoutProgress: 50,
          },
          yearly: {
            totalAmount: `$${totalEarnings.toLocaleString()}`,
            change: "↗ +0% this year",
            chartBars: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
            chartLabels: ["2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
            activeBarIndex: 11,
            nextPayout: "-",
            nextPayoutDate: "No data",
            payoutProgress: 50,
          }
        });
      }
    } catch (err) {
      console.error("Error al cargar reservas:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Invocamos solo si estamos en la vista de alojamientos para no saturar si no lo ve
    if (activeItem === "listings" || activeItem === "reservations" || activeItem === "dashboard") {
      loadHousings();
    }
  }, [activeItem]);

  const handleSidebarSelect = (itemId) => {
    if (
      activeItem === "settings" &&
      itemId !== "settings" &&
      settingsDirty
    ) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'Tienes cambios sin guardar. Si sales, se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveItem(itemId);
          if (itemId === "listings") {
            setListingAction(null);
          }
        }
      });
      return;
    }

    setActiveItem(itemId);
    if (itemId === "listings") {
      setListingAction(null);
    }
  };

  const metrics = useMemo(
    () => {
      const activeCount = registeredListings.filter(l => l.status === "Publicado").length;
      const earnings = hostBookings.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);

      return [
        { id: "earnings", label: "INGRESOS TOTALES", value: `$${earnings.toLocaleString()}`, note: "Total acumulado", tone: "success" },
        { id: "active", label: "ALOJAMIENTOS ACTIVOS", value: String(registeredListings.length), note: `${registeredListings.length - activeCount} pendientes de aprobación`, tone: "neutral" },
        { id: "new", label: "RESERVAS", value: String(hostBookings.length), note: "Todas las reservas", tone: "highlight" },
      ];
    },
    [registeredListings, hostBookings]
  );

  const amenityItems = useMemo(
    () => [
      { id: "wifi", label: "Wi-Fi rápido", icon: Wifi },
      { id: "pool", label: "Piscina privada", icon: Waves },
      { id: "parking", label: "Estacionamiento gratuito", icon: Car },
      { id: "aircon", label: "Aire acondicionado", icon: Snowflake },
      { id: "fireplace", label: "Chimenea", icon: Flame },
      { id: "kitchen", label: "Cocina completa", icon: CookingPot },
    ],
    []
  );

  const propertyTypeOptions = [
    { value: "", label: "Selecciona el tipo de alojamiento" },
    { value: "architectural-home", label: "Casa arquitectónica" },
    { value: "luxury-villa", label: "Villa de lujo" },
    { value: "urban-loft", label: "Loft urbano" },
    { value: "cabin", label: "Cabaña" },
  ];

  const reservationDashboardByListing = useMemo(() => {
    const dashboard = {};
    registeredListings.forEach(listing => {
      const currentBookings = hostBookings.filter(b => b.housing?.id_housing === listing.realId || b.id_housing === listing.realId);

      const arrivals = currentBookings.map(b => {
        const startDate = new Date(b.start_date);
        const endDate = new Date(b.end_date);
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: "arr-" + b.id_booking,
          guest: b.user?.name || "Viajero",
          checkIn: b.start_date,
          checkOut: b.end_date,
          nights: diffDays > 0 ? diffDays : 1,
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80",
          note: null,
          status: b.status === "confirmed" ? "nueva" : "pendiente"
        };
      });

      const calendarEvents = currentBookings.flatMap(b => [
        { date: b.start_date, label: "ENTRADA: " + (b.user?.name?.toUpperCase() || "VIAJERO"), tone: "checkin" },
        { date: b.end_date, label: "SALIDA", tone: "checkout" }
      ]);

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1; // 1-indexed

      dashboard[listing.id] = {
        initialView: { year, month },
        occupancyByMonth: {
          [`${year}-${String(month).padStart(2, '0')}`]: { label: "OCUPACIÓN DEL MES", percent: "Detalles", delta: "" }
        },
        arrivals,
        calendarEvents
      };
    });
    return dashboard;
  }, [registeredListings, hostBookings]);

  const updateEditField = (field, value) => {
    setEditListingForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateNewField = (field, value) => {
    setNewListingForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEditAmenity = (id) => {
    setEditListingForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [id]: !prev.amenities[id]
      }
    }));
  };

  const toggleNewAmenity = (id) => {
    setNewListingForm((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [id]: !prev.amenities[id]
      }
    }));
  };

  const handleSelectRegisteredListing = (listing) => {
    setEditListingForm({
      id: listing.realId, // crucial para luego actualizar!
      title: listing.title,
      propertyType: listing.propertyType,
      description: listing.description,
      address: listing.address,
      cityRegion: listing.cityRegion,
      country: listing.country || "",
      department: listing.department || "",
      visibility: listing.visibility,
      basePrice: listing.basePrice,
      weeklyDiscount: listing.weeklyDiscount,
      cleaningFee: listing.cleaningFee,
      latitude: listing.latitude || "",
      longitude: listing.longitude || "",
      amenities: {
        wifi: Boolean(listing.amenities?.wifi),
        pool: Boolean(listing.amenities?.pool),
        parking: Boolean(listing.amenities?.parking),
        aircon: Boolean(listing.amenities?.aircon),
        fireplace: Boolean(listing.amenities?.fireplace),
        kitchen: Boolean(listing.amenities?.kitchen),
      }
    });

    const allImages = listing.housing_images || [];
    console.log("allImages inside handleSelect:", allImages);
    const normalImgs = allImages.filter(img => !img.is_panorama).map(img => ({
      src: img.image_url,
      name: img.image_url.split('/').pop() || "Foto guardada",
      id: img.id_image
    }));

    const panoImgs = allImages.filter(img => img.is_panorama).map(img => ({
      src: img.image_url,
      name: img.image_url.split('/').pop() || "Modelo 360 guardado",
      id: img.id_image
    }));
    console.log("panoImgs mapped:", panoImgs);

    setEditListingPhotos(normalImgs);
    setEditListingPanoramaPhotos(panoImgs);
    setDeletedPhotoIds([]);
    setListingAction("edit");
  };


  const removeEditPhoto = (index) => {
    const photo = editListingPhotos[index];
    if (photo && photo.id) {
      setDeletedPhotoIds((prev) => [...prev, photo.id]);
    }
    setEditListingPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
  };

  const removeNewPhoto = (index) => {
    setNewListingPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index));
  };

  const removeNewPanoramaPhoto = (index) => {
    setNewListingPanoramaPhotos((prev) => {
      const item = prev[index];
      try {
        if (item && item.src && item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
      } catch (e) {
        // ignore
      }
      return prev.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  // Revocar object URLs al desmontar o cuando cambie la lista
  useEffect(() => {
    return () => {
      newListingPanoramaPhotos.forEach((item) => {
        try {
          if (item && item.src && item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
        } catch (e) {
          // ignore
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePanoramaValid = async (file, info) => {
    if (!file) return;
    // Crear object URL para preview/uso inmediato
    const src = URL.createObjectURL(file);
    setNewListingPanoramaPhotos((prev) => [...prev, { src, name: file.name || "panorama.jpg", file }]);
  };

  const handleNewPhotoUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          setNewListingPhotos((prev) => [...prev, { src: dataUrl, name: file.name, file }]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same file can be selected again
    event.target.value = "";
  };

  const handleNewPanoramaPhotoUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          setNewListingPanoramaPhotos((prev) => [...prev, { src: dataUrl, name: file.name, file }]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const removeEditPanoramaPhoto = (index) => {
    const photo = editListingPanoramaPhotos[index];
    if (photo && photo.id) {
      setDeletedPhotoIds((prev) => [...prev, photo.id]);
    }
    setEditListingPanoramaPhotos((prev) => {
      const item = prev[index];
      try {
        if (item && item.src && item.src.startsWith("blob:")) URL.revokeObjectURL(item.src);
      } catch (e) { }
      return prev.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  const handleEditPanoramaValid = async (file, info) => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    setEditListingPanoramaPhotos((prev) => [...prev, { src, name: file.name, file }]);
  };

  const handleEditPhotoUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          setEditListingPhotos((prev) => [...prev, { src: dataUrl, name: file.name, file }]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleEditPanoramaPhotoUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === "string") {
          setEditListingPanoramaPhotos((prev) => [...prev, { src: dataUrl, name: file.name, file }]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const handleSaveNewListing = async (isDraft) => {
    try {
      setIsProcessing(true);
      let typeId = 1;
      if (newListingForm.propertyType === 'luxury-villa') typeId = 2;
      if (newListingForm.propertyType === 'urban-loft') typeId = 3;
      if (newListingForm.propertyType === 'cabin') typeId = 4;

      const payload = {
        name: newListingForm.title || (isDraft ? "Borrador de alojamiento" : "Nuevo alojamiento"),
        description: newListingForm.description || "Sin descripción",
        country: newListingForm.country || "",
        department: newListingForm.department || "",
        municipality: newListingForm.cityRegion || "",
        address: newListingForm.address || "Sin dirección",
        price_per_night: parseInt(newListingForm.basePrice) || 0,
        capacity: 4,
        id_type: typeId,
        status: isDraft ? 'maintenance' : 'available',
        latitude: newListingForm.latitude ? parseFloat(newListingForm.latitude) : null,
        longitude: newListingForm.longitude ? parseFloat(newListingForm.longitude) : null
      };

      const newHousing = await createHousing(payload);
      const idHousing = newHousing?.id_housing;

      if (idHousing) {
        // Subir fotos normales
        for (const item of newListingPhotos) {
          if (item.file) {
            try {
              await uploadHousingImage(idHousing, item.file, false);
            } catch (err) {
              console.error("Error subiendo foto normal:", err);
            }
          }
        }

        // Subir fotos panorámicas
        for (const item of newListingPanoramaPhotos) {
          if (item.file) {
            try {
              await uploadHousingImage(idHousing, item.file, true);
            } catch (err) {
              console.error("Error subiendo foto panorama:", err);
            }
          }
        }
      }

      Swal.fire({
        title: 'Éxito',
        text: isDraft ? "Borrador guardado exitosamente." : "Alojamiento creado exitosamente. ¡Continúa configurando!",
        icon: 'success'
      });

      // Recarga los alojamientos para mostrar el nuevo
      await loadHousings();

      // Reset variables
      setNewListingPhotos([]);
      setNewListingPanoramaPhotos([]);
      setListingAction(null);
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: `Error al guardar: ${error.message}`,
        icon: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedReservationListing =
    registeredListings.find((listing) => listing.id === selectedReservationListingId) || registeredListings[0];

  const fallbackReservationData = {
    initialView: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    occupancyByMonth: {},
    arrivals: [],
    calendarEvents: []
  };

  const selectedReservationData =
    reservationDashboardByListing[selectedReservationListing?.id || ""] ||
    reservationDashboardByListing["lst-1"] ||
    fallbackReservationData;

  const handleHostPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHostPhoto(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const reservationMonthLabel = reservationViewDate.toLocaleString("es-ES", {
    month: "long",
    year: "numeric"
  });
  const reservationMonthKey = `${reservationViewDate.getFullYear()}-${String(reservationViewDate.getMonth() + 1).padStart(2, "0")}`;
  const occupancyData = selectedReservationData.occupancyByMonth[reservationMonthKey] || {
    label: `OCUPACIÓN ${reservationViewDate.toLocaleString("es-ES", { month: "short" }).toUpperCase()}`,
    percent: "--",
    delta: "Sin datos para este mes"
  };

  const reservationEventsByDate = selectedReservationData.calendarEvents.reduce((accumulator, event) => {
    if (!accumulator[event.date]) accumulator[event.date] = [];
    accumulator[event.date].push({ label: event.label, tone: event.tone });
    return accumulator;
  }, {});

  const firstDayOfMonth = new Date(reservationViewDate.getFullYear(), reservationViewDate.getMonth(), 1);
  const monthStartWeekday = firstDayOfMonth.getDay();
  const daysInCurrentMonth = new Date(reservationViewDate.getFullYear(), reservationViewDate.getMonth() + 1, 0).getDate();
  const daysInPrevMonth = new Date(reservationViewDate.getFullYear(), reservationViewDate.getMonth(), 0).getDate();
  const totalCells = Math.ceil((monthStartWeekday + daysInCurrentMonth) / 7) * 7;

  const reservationCalendarCells = Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - monthStartWeekday + 1;
    const cellDate = new Date(reservationViewDate.getFullYear(), reservationViewDate.getMonth(), dayOffset);
    const isMuted = cellDate.getMonth() !== reservationViewDate.getMonth();
    const key = toDateKey(cellDate);
    const tags = reservationEventsByDate[key] || [];

    let displayDay = dayOffset;
    if (dayOffset <= 0) displayDay = daysInPrevMonth + dayOffset;
    if (dayOffset > daysInCurrentMonth) displayDay = dayOffset - daysInCurrentMonth;

    return {
      id: key,
      key,
      date: cellDate,
      day: String(displayDay),
      muted: isMuted,
      tags
    };
  });

  const reservationArrivals = selectedReservationData.arrivals
    .filter((arrival) => {
      const arrivalDate = new Date(arrival.checkIn);
      return (
        arrivalDate.getFullYear() === reservationViewDate.getFullYear() &&
        arrivalDate.getMonth() === reservationViewDate.getMonth()
      );
    })
    .map((arrival) => {
      const checkIn = new Date(arrival.checkIn);
      const checkOut = new Date(arrival.checkOut);
      const formattedStay = `${checkIn.toLocaleString("es-ES", { month: "short" })} ${checkIn.getDate()} - ${checkOut.toLocaleString("es-ES", { month: "short" })} ${checkOut.getDate()} (${arrival.nights} noches)`;
      return { ...arrival, stay: formattedStay };
    });

  const visibleArrivals = reservationArrivals.length > 0 ? reservationArrivals : selectedReservationData.arrivals.slice(0, 3).map((arrival) => {
    const checkIn = new Date(arrival.checkIn);
    const checkOut = new Date(arrival.checkOut);
    const formattedStay = `${checkIn.toLocaleString("es-ES", { month: "short" })} ${checkIn.getDate()} - ${checkOut.toLocaleString("es-ES", { month: "short" })} ${checkOut.getDate()} (${arrival.nights} noches)`;
    return { ...arrival, stay: formattedStay };
  });

  const newArrivalCount = visibleArrivals.filter((arrival) => arrival.status === "nueva").length;

  const goToPrevMonth = () => {
    setReservationViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setReservationViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleReservationListingChange = (nextId) => {
    setSelectedReservationListingId(nextId);
    const listingData = reservationDashboardByListing[nextId] || reservationDashboardByListing["lst-1"];
    if (listingData?.initialView) {
      const { year, month } = listingData.initialView;
      setReservationViewDate(new Date(year, month - 1, 1));
      setSelectedCalendarDate(`${year}-${String(month).padStart(2, "0")}-01`);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setReservationViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedCalendarDate(toDateKey(today));
  };

  const renderRegisteredListingsView = () => (
    <section className="hostRegisteredListings">
      <header className="hostEditorHeader">
        <p>Alojamientos · Propiedades Registradas</p>
        <h1>Elige un alojamiento para editar</h1>
        <span>Selecciona uno de tus alojamientos con detalles del perfil para continuar.</span>
      </header>

      <div className="hostRegisteredGrid">
        {registeredListings.map((listing) => (
          <article key={listing.id} className="hostRegisteredCard">
            <img src={listing.coverImage} alt={listing.title} className="hostRegisteredCover" />
            <div className="hostRegisteredContent">
              <div className="hostRegisteredTopRow">
                <h2>{listing.title}</h2>
                <span className={`hostRegisteredBadge ${listing.status === "Borrador" ? "isDraft" : ""}`}>{listing.status}</span>
              </div>

              <p className="hostRegisteredLocation">
                <MapPin size={14} />
                {listing.cityRegion}{listing.country ? `, ${listing.country}` : ''}
              </p>

              <div className="hostRegisteredMeta">
                <span>
                  <Star size={14} /> {listing.rating}
                </span>
                <span>{listing.reservations} reservas</span>
              </div>

              <div className="hostRegisteredProfile">
                <img src={listing.hostAvatar} alt={listing.hostName} />
                <div>
                  <strong>{listing.hostName}</strong>
                  <small>Perfil del anfitrión</small>
                </div>
              </div>

              <button
                type="button"
                className="hostListingPrimaryBtn"
                onClick={() => handleSelectRegisteredListing(listing)}
              >
                Editar este alojamiento
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );

  const renderDashboardView = () => {
    const upcomingBookings = hostBookings.slice(0, 5).map(b => {
      const start = b.start_date ? new Date(b.start_date) : new Date();
      const end = b.end_date ? new Date(b.end_date) : new Date();
      let startStr = "TBD";
      let endStr = "TBD";
      try {
        startStr = start.toLocaleDateString("es-ES", { month: "short", day: "2-digit" });
        endStr = end.toLocaleDateString("es-ES", { month: "short", day: "2-digit" });
      } catch (e) { }

      return {
        id: b.id_booking,
        guest: b.user?.name || "Viajero",
        dates: `${startStr} - ${endStr}`,
        listing: b.housing?.name || "Alojamiento",
        status: b.status || "pending",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80"
      };
    });

    return (
      <>
        <header className="hostTopBar">
          <div>
            <h1>Bienvenido de nuevo, {displayName}</h1>
            <p>Tu cartera está rindiendo un 12% mejor que el mes pasado.</p>
          </div>
          <div className="hostLiveBadge">
            <span />
            En vivo: {registeredListings.length} alojamientos
          </div>
        </header>

        <section className="hostMetricsGrid">
          {metrics.map((metric) => (
            <article key={metric.id} className={`hostMetricCard ${metric.tone}`}>
              <p>{metric.label}</p>
              <h3>{metric.value}</h3>
              <small>{metric.note}</small>
              {metric.id === "earnings" ? <CircleDollarSign size={22} /> : null}
              {metric.id === "active" ? <Building2 size={22} /> : null}
              {metric.id === "new" ? <Sparkles size={22} /> : null}
            </article>
          ))}
        </section>

        <section className="hostContentGrid">
          <div className="hostReservations">
            <div className="hostSectionHeader">
              <h2>Próximas reservas</h2>
              <button type="button">Ver todo</button>
            </div>
            <div className="hostReservationList">
              {upcomingBookings.length > 0 ? upcomingBookings.map((reservation) => (
                <article key={reservation.id} className="hostReservationRow">
                  <img src={reservation.avatar} alt={reservation.guest} />
                  <div>
                    <h3>{reservation.guest}</h3>
                    <p>
                      {reservation.dates} · {reservation.listing}
                    </p>
                  </div>
                  <span className={`hostStatus ${reservation.status}`}>{reservation.status}</span>
                </article>
              )) : <p style={{ padding: "20px", color: "#666" }}>No hay reservas próximas disponibles.</p>}
            </div>
          </div>
        </section>
      </>
    );
  };
  const renderReservationsView = () => (
    <section className="hostReservationsPage">
      <header className="hostReservationsTopBar">
        <div>
          <h1>Calendario de reservas</h1>
          <p>Gestiona entradas, mensajes de huéspedes y ciclos de ocupación</p>
        </div>

        <div className="hostReservationsActions">
          <div className="hostPropertySelector">
            <House size={16} />
            <select
              className="hostPropertySelectField"
              value={selectedReservationListing?.id || ""}
              onChange={(event) => handleReservationListingChange(event.target.value)}
              aria-label="Seleccionar alojamiento"
            >
              {registeredListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
          <button type="button" className="hostRoundIconBtn" aria-label="Notificaciones">
            <Bell size={16} />
          </button>
          <button type="button" className="hostRoundIconBtn" aria-label="Ajustes">
            <Settings size={16} />
          </button>
        </div>
      </header>

      <div className="hostReservationsLayout">
        <section className="hostCalendarCard">
          <div className="hostCalendarHeader">
            <h2>{reservationMonthLabel}</h2>
            <div className="hostCalendarNav">
              <button type="button" aria-label="Mes anterior" onClick={goToPrevMonth}>‹</button>
              <button type="button" className="hostTodayBtn" onClick={goToToday}>Hoy</button>
              <button type="button" aria-label="Mes siguiente" onClick={goToNextMonth}>›</button>
            </div>
          </div>

          <div className="hostCalendarWeekdays">
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="hostCalendarGrid">
            {reservationCalendarCells.map((cell) => {
              const primaryTone = cell.tags?.[0]?.tone || null;

              return (
                <article
                  key={cell.id}
                  className={`hostCalendarCell ${cell.muted ? "isMuted" : ""} ${selectedCalendarDate === cell.key ? "isSelected" : ""} ${primaryTone ? `hasEvent has-${primaryTone}` : ""}`}
                  onClick={() => setSelectedCalendarDate(cell.key)}
                >
                  <strong>
                    {cell.day}
                    {primaryTone ? <i className={`hostCalendarDateDot ${primaryTone}`} aria-hidden="true" /> : null}
                  </strong>
                  {cell.tags?.map((tag) => (
                    <span key={tag.label} className={`hostCalendarTag ${tag.tone}`}>
                      {tag.label}
                    </span>
                  ))}
                </article>
              );
            })}
          </div>

          <div className="hostCalendarLegend">
            <span><i className="isCheckin" />ENTRADA</span>
            <span><i className="isReserved" />RESERVADO</span>
            <span><i className="isCheckout" />SALIDA</span>
            <span><i className="isInquiry" />CONSULTA</span>
            <span><i className="isStaff" />PERSONAL / LIMPIEZA</span>
            <span><i className="isBlocked" />BLOQUEADO</span>
          </div>
        </section>

        <aside className="hostArrivalsPanel">
          <div className="hostArrivalsHeader">
            <h2>Próximas llegadas</h2>
            <span>{newArrivalCount} NUEVAS</span>
          </div>

          <div className="hostArrivalsList">
            {visibleArrivals.map((arrival) => (
              <article key={arrival.id} className={`hostArrivalCard ${arrival.status === "pending" ? "isPending" : ""}`}>
                <header>
                  <img src={arrival.avatar} alt={arrival.guest} />
                  <div>
                    <h3>{arrival.guest}</h3>
                    <p>{arrival.stay}</p>
                  </div>
                  <button type="button" aria-label="Más opciones">
                    <MoreHorizontal size={16} />
                  </button>
                </header>

                {arrival.note ? (
                  <div className="hostGuestNote">
                    <small>NOTA DEL HUÉSPED:</small>
                    <p>{arrival.note}</p>
                  </div>
                ) : null}

                <div className="hostArrivalActions">
                  <button
                    type="button"
                    className="hostArrivalMessageBtn"
                    onClick={() => {
                      setSelectedMessageGuestName(arrival.guest);
                      setActiveItem("messages");
                    }}
                  >
                    Mensaje
                  </button>
                  <button type="button" className="hostRoundIconBtn" aria-label="More actions">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <article className="hostOccupancyCard">
            <p>{occupancyData.label}</p>
            <h3>{occupancyData.percent}</h3>
            <span>{occupancyData.delta}</span>
            <button type="button" aria-label="Add">+</button>
          </article>
        </aside>
      </div>
    </section>
  );

  const renderEarningsView = () => (
    <section className="hostEarningsPage">
      <header className="hostEarningsHeader">
        <div>
          <h1>Panel de ingresos</h1>
          <p>Gestiona tus ingresos y el rendimiento financiero de todos los alojamientos.</p>
        </div>
        <div className="hostEarningsControls">
          <div className="hostEarningsToggle">
            <button
              type="button"
              className={`hostToggleBtn ${earningsView === 'monthly' ? 'isActive' : ''}`}
              onClick={() => setEarningsView('monthly')}
            >
              Mensual
            </button>
            <button
              type="button"
              className={`hostToggleBtn ${earningsView === 'yearly' ? 'isActive' : ''}`}
              onClick={() => setEarningsView('yearly')}
            >
              Anual
            </button>
          </div>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              className="hostFilterBtn"
              onClick={() => setShowEarningsDropdown(!showEarningsDropdown)}
            >
              <Settings size={14} />
              {selectedEarningsListing
                ? registeredListings.find(l => l.id === selectedEarningsListing)?.title || 'Todos los alojamientos'
                : 'Todos los alojamientos'
              }
            </button>
            {showEarningsDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '250px',
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEarningsListing(null);
                    setShowEarningsDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    border: 'none',
                    backgroundColor: !selectedEarningsListing ? '#f4f8ff' : 'transparent',
                    color: '#2f6fb2',
                    fontWeight: !selectedEarningsListing ? '600' : '500',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e0e0e0',
                    fontSize: '14px',
                  }}
                >
                  Todos los alojamientos
                </button>
                {registeredListings.map(listing => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => {
                      setSelectedEarningsListing(listing.id);
                      setShowEarningsDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: selectedEarningsListing === listing.id ? '#f4f8ff' : 'transparent',
                      color: selectedEarningsListing === listing.id ? '#2f6fb2' : '#333',
                      fontWeight: selectedEarningsListing === listing.id ? '600' : '500',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '14px',
                    }}
                  >
                    {listing.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="hostExportBtn"
            onClick={handleExportPDF}
          >
            <Upload size={14} />
            Exportar PDF
          </button>
        </div>
      </header>

      <div className="hostEarningsGrid">
        <article className="hostEarningsCard hostEarningsLarge">
          <h2>INGRESOS TOTALES</h2>
          <p className="hostEarningsAmount">{currentEarningsData.totalAmount}</p>
          <span className="hostEarningsChange">{currentEarningsData.change}</span>

          <div className="hostEarningsChart">
            {currentEarningsData.chartBars.map((height, index) => (
              <div
                key={index}
                className={`hostChartBar ${index === currentEarningsData.activeBarIndex ? 'hostChartBarActive' : ''}`}
                style={{ height: `${height}%` }}
                title={currentEarningsData.chartLabels[index]}
              />
            ))}
          </div>

          <div className="hostChartLabels">
            {currentEarningsData.chartLabels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
        </article>

        <article className="hostEarningsCard hostEarningsSmall">
          <div className="hostPayoutIconWrap">
            <Building2 size={24} />
          </div>
          <p>PRÓXIMO PAGO</p>
          <h2>{currentEarningsData.nextPayout}</h2>
          <small>📅 Previsto para {currentEarningsData.nextPayoutDate}</small>

          <div className="hostPayoutProgress">
            <div className="hostProgressBar" style={{ width: `${currentEarningsData.payoutProgress}%` }}></div>
          </div>
          <small className="hostProgressLabel">El pago está procesado en un {currentEarningsData.payoutProgress}%</small>

          <button type="button" className="hostEarningsLink">Ver detalles del pago</button>
        </article>
      </div>

      <section className="hostTransactionsSection">
        <header className="hostTransactionsHeader">
          <h2>Transacciones recientes</h2>
          <button type="button" className="hostEarningsLink">Ver historial completo</button>
        </header>

        <div className="hostTransactionsTable">
          <div className="hostTableHeader">
            <div className="hostTableCol hostTableColGUEST">HUÉSPED</div>
            <div className="hostTableCol hostTableColDATES">FECHAS</div>
            <div className="hostTableCol hostTableColLISTING">ALOJAMIENTO</div>
            <div className="hostTableCol hostTableColEARNINGS">INGRESO NETO</div>
            <div className="hostTableCol hostTableColSTATUS">ESTADO</div>
          </div>

          <div className="hostTableBody">
            {filteredTransactions.map(transaction => (
              <article key={transaction.id} className="hostTableRow">
                <div className="hostTableCol hostTableColGUEST">
                  <img src={transaction.guestAvatar} alt={transaction.guest} className="hostTransactionAvatar" />
                  <div>
                    <strong>{transaction.guest}</strong>
                    <small>Reserva #{transaction.bookingId}</small>
                  </div>
                </div>
                <div className="hostTableCol hostTableColDATES">
                  <span>{transaction.dateRange}</span>
                  <small>{transaction.nights} noches</small>
                </div>
                <div className="hostTableCol hostTableColLISTING">
                  <span>{transaction.listingName}</span>
                  <small>{transaction.listingType}</small>
                </div>
                <div className="hostTableCol hostTableColEARNINGS">
                  <strong>{transaction.earnings}</strong>
                </div>
                <div className="hostTableCol hostTableColSTATUS">
                  <span className={`hostStatusTag ${transaction.status === 'PAID' ? 'hostStatusPaid' : 'hostStatusPending'}`}>
                    {transaction.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  );

  const renderSettingsView = () => (
    <SettingsSection
      profilePhoto={hostPhoto}
      onProfilePhotoChange={setHostPhoto}
      onDirtyChange={setSettingsDirty}
    />
  );

  const handleSupportSubmit = (event) => {
    event.preventDefault();

    if (!supportForm.subject.trim() || !supportForm.details.trim()) {
      setSupportStatus("error");
      return;
    }

    setSupportStatus("sent");
    window.setTimeout(() => setSupportStatus("idle"), 2200);
    setSupportForm((prev) => ({ ...prev, subject: "", details: "" }));
  };

  const renderSupportView = () => (
    <section className="hostSupportPage">
      <header className="hostSupportHeader">
        <div>
          <h1>Centro de soporte</h1>
          <p>Comparte tu solicitud y nuestro equipo te contactara lo antes posible.</p>
        </div>
      </header>

      <div className="hostSupportGrid">
        <section className="hostSupportCard hostSupportContactCard">
          <img src={logoImage} alt="StayGoo" className="hostSupportLogo" />
          <h2>Soporte para anfitriones de Horizon Stays</h2>
          <p>Equipo especializado para anfitriones premium.</p>

          <div className="hostSupportContactList">
            <article>
              <Mail size={16} />
              <div>
                <strong>Correo electrónico</strong>
                <span>host-support@horizonstays.com</span>
              </div>
            </article>
            <article>
              <Phone size={16} />
              <div>
                <strong>Contacto directo</strong>
                <span>+1 (555) 782-9012</span>
              </div>
            </article>
          </div>
        </section>

        <section className="hostSupportCard">
          <h2>Enviar solicitud</h2>
          <form className="hostSupportForm" onSubmit={handleSupportSubmit}>
            <label>
              Nombre de contacto
              <input
                value={supportForm.contactName}
                onChange={(event) =>
                  setSupportForm((prev) => ({ ...prev, contactName: event.target.value }))
                }
                placeholder="Tu nombre"
              />
            </label>

            <label>
              Asunto
              <input
                value={supportForm.subject}
                onChange={(event) =>
                  setSupportForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Ej: Problema con reserva"
              />
            </label>

            <label>
              Detalles
              <textarea
                value={supportForm.details}
                onChange={(event) =>
                  setSupportForm((prev) => ({ ...prev, details: event.target.value }))
                }
                placeholder="Describe la situacion, fechas y codigo de reserva si aplica."
              />
            </label>

            <button type="submit" className="hostSupportSendBtn">
              Enviar a soporte
            </button>

            {supportStatus === "sent" ? (
              <p className="hostSupportStatus isSuccess">Solicitud enviada. Te responderemos por correo.</p>
            ) : null}
            {supportStatus === "error" ? (
              <p className="hostSupportStatus isError">Completa asunto y detalles para continuar.</p>
            ) : null}
          </form>
        </section>
      </div>
    </section>
  );

  const renderListingsView = () => (
    <section className="hostListingEditor">
      <header className="hostEditorHeader">
        <p>Alojamientos · Editar alojamiento</p>
        <h1>{editListingForm.title || "Editar alojamiento"}</h1>
        <span>Actualiza los detalles de tu propiedad para atraer a más viajeros premium.</span>
      </header>

      <div className="hostEditorSectionHeader">
        <h2>Datos básicos</h2>
        <small>OBLIGATORIO</small>
      </div>
      <section className="hostEditorCard hostBasicsCard">
        <label>
          Título del alojamiento
          <input
            value={editListingForm.title}
            onChange={(event) => updateEditField("title", event.target.value)}
            placeholder="Ej: El Pabellón de Cristal"
          />
        </label>
        <label>
          Tipo de alojamiento
          <div className="hostSelectMock">
            <select
              className="hostSelectField"
              value={editListingForm.propertyType}
              onChange={(event) => updateEditField("propertyType", event.target.value)}
            >
              {propertyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
        </label>
        <label className="hostFieldFull">
          Descripción
          <textarea
            value={editListingForm.description}
            onChange={(event) => updateEditField("description", event.target.value)}
            placeholder="Describe tu alojamiento"
          />
        </label>
      </section>

      <div className="hostEditorSectionHeader">
        <h2>Dirección</h2>
      </div>
      <section className="hostEditorCard">
        <div className="hostLocationInfo" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Dirección
            <input
              value={editListingForm.address}
              onChange={(event) => updateEditField("address", event.target.value)}
              placeholder="Calle y número"
            />
          </label>
          <label>
            País
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={editListingForm.country}
                onChange={(event) => {
                  updateEditField("country", event.target.value);
                  updateEditField("department", ""); // reset dept
                  updateEditField("cityRegion", ""); // reset city
                }}
              >
                <option value="">Seleccione un país...</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label>
            Departamento / Estado
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={editListingForm.department}
                onChange={(event) => {
                  updateEditField("department", event.target.value);
                  updateEditField("cityRegion", ""); // reset city when dept changes
                }}
                disabled={loadingDepartments || !editListingForm.country || availableDepartments.length === 0}
              >
                <option value="">{loadingDepartments ? "Cargando..." : "Seleccione un departamento..."}</option>
                {availableDepartments.map((dept, idx) => (
                  <option key={idx} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label>
            Pueblo / Municipio
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={editListingForm.cityRegion}
                onChange={(event) => updateEditField("cityRegion", event.target.value)}
                disabled={loadingCities || !editListingForm.department || availableCities.length === 0}
              >
                <option value="">{loadingCities ? "Cargando..." : "Seleccione un municipio..."}</option>
                {availableCities.map((city, idx) => (
                  <option key={idx} value={city.name}>{city.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Visibilidad
            <input
              value={editListingForm.visibility}
              onChange={(event) => updateEditField("visibility", event.target.value)}
              placeholder="Configuración de visibilidad"
            />
          </label>
          <div style={{ gridColumn: '1 / -1', height: '300px', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
            <GoogleMapPicker
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              position={
                editListingForm.latitude && editListingForm.longitude
                  ? { lat: parseFloat(editListingForm.latitude), lng: parseFloat(editListingForm.longitude) }
                  : null
              }
              onChange={(coords) => {
                updateEditField("latitude", coords.lat);
                updateEditField("longitude", coords.lng);
              }}
            />
          </div>
        </div>
      </section>

      <div className="hostEditorSectionHeader">
        <h2>Comodidades</h2>
        <small>{Object.values(editListingForm.amenities).filter(Boolean).length} seleccionadas</small>
      </div>
      <section className="hostEditorCard hostAmenitiesCard">
        <div className="hostAmenitiesGrid">
          {amenityItems.map((item) => (
            <button
              key={item.id}
              className={`hostAmenityChip ${editListingForm.amenities[item.id] ? "isActive" : ""}`}
              type="button"
              onClick={() => toggleEditAmenity(item.id)}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
              <span className={`hostAmenityCheck ${editListingForm.amenities[item.id] ? "isSelected" : ""}`}>
                {editListingForm.amenities[item.id] ? <CheckCircle2 size={13} /> : null}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="hostBrowseAmenities">
          <PlusCircle size={14} />
          Ver las 100+ comodidades
        </button>
      </section>

      <div className="hostEditorSectionHeader">
        <h2>Precio y disponibilidad</h2>
      </div>
      <section className="hostPricingGrid">
        <article className="hostPricingCard">
          <p>PRECIO BASE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 10px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3138' }}>$</span>
            <input
              type="text"
              className="hostPricingInput"
              style={{ margin: 0 }}
              value={(() => {
                const val = editListingForm.basePrice;
                if (!val) return '';
                const cleanStr = String(val).replace(/\D/g, '');
                if (!cleanStr) return '';
                const num = parseInt(cleanStr, 10);
                return isNaN(num) ? '' : num.toLocaleString('en-US');
              })()}
              onChange={(event) => {
                const rawValue = event.target.value.replace(/\D/g, '');
                updateEditField("basePrice", rawValue);
              }}
              placeholder="850"
            />
          </div>
          <button type="button">Ajustar</button>
        </article>

      </section>

      <div className="hostEditorSectionHeader">
        <h2>Fotos</h2>
      </div>
      <section className="hostEditorCard hostPhotosCard hostPhotosCardSingle">
        <input
          type="file"
          ref={editListingCoverPhotoRef}
          onChange={handleEditPhotoUpload}
          accept="image/*"
          hidden
          multiple={true}
        />
        <div className="hostPhotoAttachmentLayout">
          <button
            type="button"
            className={`hostUploadCard hostUploadCardLarge hostSinglePhotoDropzone ${editListingPhotos.length > 0 ? "hasContent" : ""}`}
            onClick={() => editListingCoverPhotoRef.current?.click()}
          >
            <Upload size={22} />
            <strong>{editListingPhotos.length > 0 ? "Subir más fotos" : "Subir fotos"}</strong>
            <span>Permite subir múltiples fotos</span>
          </button>

          <div className="hostPhotoAttachmentListWrap">
            <div className="hostPhotoAttachmentListHeader">
              <p>Fotos adjuntas</p>
              <span>{editListingPhotos.length}</span>
            </div>

            <div className="hostPhotoAttachmentList">
              {editListingPhotos.length > 0 ? (
                editListingPhotos.map((photo, index) => (
                  <article className="hostPhotoAttachmentItem" key={`${photo.name}-${index}`}>
                    <div className="hostPhotoAttachmentThumb">
                      <img src={photo.src} alt={photo.name} />
                    </div>
                    <div className="hostPhotoAttachmentMeta">
                      <strong>{photo.name}</strong>
                      <span>Adjuntada</span>
                    </div>
                    <button
                      type="button"
                      className="hostDeletePhotoBtn"
                      aria-label={`Eliminar foto ${index + 1}`}
                      onClick={() => removeEditPhoto(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="hostPhotoAttachmentEmpty">Sin fotos adjuntas.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="hostEditorSectionHeader hostEditorSectionHeaderSpaced">
        <h2>Modelo 360</h2>
      </div>
      <section className="hostEditorCard hostPanoramaCard">
        <div className="hostPhotoAttachmentLayout hostPanoramaAttachmentLayout">
          <EquirectangularUploader
            onValidImage={handleEditPanoramaValid}
            strict={false}
          />

          <div className="hostPhotoAttachmentListWrap">
            <div className="hostPhotoAttachmentListHeader">
              <p>Modelo 360 adjunto</p>
              <span>{editListingPanoramaPhotos.length}</span>
            </div>

            <div className="hostPhotoAttachmentList">
              {editListingPanoramaPhotos.length > 0 ? (
                editListingPanoramaPhotos.map((photo, index) => (
                  <article className="hostPhotoAttachmentItem" key={`${photo.name}-${index}`}>
                    <div className="hostPhotoAttachmentThumb">
                      <img src={photo.src} alt={photo.name} />
                    </div>
                    <div className="hostPhotoAttachmentMeta">
                      <strong>{photo.name}</strong>
                      <span>360° adjunta</span>
                    </div>
                    <button
                      type="button"
                      className="hostDeletePhotoBtn"
                      aria-label={`Eliminar imagen 360 ${index + 1}`}
                      onClick={() => removeEditPanoramaPhoto(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="hostPhotoAttachmentEmpty">Sin imágenes 360 adjuntas.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="hostEditorCard hostCalendarSync">
        <div>
          <h3>Sincronización de calendario</h3>
          <p>
            <CheckCircle2 size={14} />
            Google Calendar sincronizado correctamente · Última actualización: hace 14 min
          </p>
        </div>
        <button type="button">Sincronizar ahora</button>
      </section>

      <section className="hostEditorCard hostListingActionsCard">
        <button
          type="button"
          className="hostListingPrimaryBtn"
          onClick={async () => {
            try {
              setIsProcessing(true);
              // ✅ Usa el ID que ya está guardado en el form
              const realId = editListingForm.id;
              if (!realId) {
                Swal.fire({ title: 'Error', text: 'No se encontró el ID del alojamiento.', icon: 'error' });
                return;
              }

              await updateHousing(realId, {
                name: editListingForm.title,
                description: editListingForm.description,
                address: editListingForm.address,
                country: editListingForm.country || "",
                department: editListingForm.department || "",
                municipality: editListingForm.cityRegion || "",
                price_per_night: Number(editListingForm.basePrice),
                status: "available",
                latitude: editListingForm.latitude ? parseFloat(editListingForm.latitude) : null,
                longitude: editListingForm.longitude ? parseFloat(editListingForm.longitude) : null
              });

              // Eliminar fotos que el usuario borró en la UI
              for (const idImage of deletedPhotoIds) {
                try {
                  await deleteHousingImage(idImage);
                } catch (err) {
                  console.error("Error deleting image from backend:", err);
                }
              }
              setDeletedPhotoIds([]);

              // Subir nuevas fotos que se hayan adjuntado
              for (const item of editListingPhotos) {
                if (item.file) {
                  try {
                    await uploadHousingImage(realId, item.file, false);
                  } catch (err) {
                    console.error("Error subiendo foto normal:", err);
                  }
                }
              }

              for (const item of editListingPanoramaPhotos) {
                if (item.file) {
                  try {
                    await uploadHousingImage(realId, item.file, true);
                  } catch (err) {
                    console.error("Error subiendo foto panorama:", err);
                  }
                }
              }

              Swal.fire({ title: 'Éxito', text: 'Datos actualizados correctamente en base de datos.', icon: 'success' });
              await loadHousings();
            } catch (err) {
              Swal.fire({ title: 'Error', text: 'Error al actualizar: ' + err.message, icon: 'error' });
            } finally {
              setIsProcessing(false);
            }
          }}
        >
          Guardar cambios
        </button>
      </section>
    </section>
  );

  const renderNewListingView = () => (
    <section className="hostListingEditor">
      <header className="hostEditorHeader">
        <p>Alojamientos · Nuevo alojamiento</p>
        <h1>Registrar nueva propiedad</h1>
        <span>Empieza con lo esencial y publica cuando tu alojamiento esté listo.</span>
      </header>

      <div className="hostEditorSectionHeader">
        <h2>Datos básicos</h2>
        <small>OBLIGATORIO</small>
      </div>
      <section className="hostEditorCard hostBasicsCard">
        <label>
          Título del alojamiento
          <input
            placeholder="Ej: Villa Horizonte Redwood"
            value={newListingForm.title}
            onChange={(event) => updateNewField("title", event.target.value)}
          />
        </label>
        <label>
          Tipo de alojamiento
          <div className="hostSelectMock">
            <select
              className="hostSelectField"
              value={newListingForm.propertyType}
              onChange={(event) => updateNewField("propertyType", event.target.value)}
            >
              {propertyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>
        </label>
        <label className="hostFieldFull">
          Descripción
          <textarea
            value={newListingForm.description}
            onChange={(event) => updateNewField("description", event.target.value)}
            placeholder="Describe el ambiente, las comodidades y qué hace único tu alojamiento para los huéspedes."
          />
        </label>
      </section>



      <div className="hostEditorSectionHeader">
        <h2>Dirección</h2>
      </div>
      <section className="hostEditorCard">
        <div className="hostLocationInfo" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
          <label style={{ gridColumn: '1 / -1' }}>
            Dirección
            <input
              value={newListingForm.address}
              onChange={(event) => updateNewField("address", event.target.value)}
              placeholder="Calle y número"
            />
          </label>
          <label>
            País
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={newListingForm.country}
                onChange={(event) => {
                  updateNewField("country", event.target.value);
                  updateNewField("department", ""); // reset dept
                  updateNewField("cityRegion", ""); // reset city
                }}
              >
                <option value="">Seleccione un país...</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label>
            Departamento / Estado
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={newListingForm.department}
                onChange={(event) => {
                  updateNewField("department", event.target.value);
                  updateNewField("cityRegion", ""); // reset city when dept changes
                }}
                disabled={loadingDepartments || !newListingForm.country || availableDepartments.length === 0}
              >
                <option value="">{loadingDepartments ? "Cargando..." : "Seleccione un departamento..."}</option>
                {availableDepartments.map((dept, idx) => (
                  <option key={idx} value={dept.name}>{dept.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label>
            Pueblo / Municipio
            <div className="hostSelectMock">
              <select
                className="hostSelectField"
                value={newListingForm.cityRegion}
                onChange={(event) => updateNewField("cityRegion", event.target.value)}
                disabled={loadingCities || !newListingForm.department || availableCities.length === 0}
              >
                <option value="">{loadingCities ? "Cargando..." : "Seleccione un municipio..."}</option>
                {availableCities.map((city, idx) => (
                  <option key={idx} value={city.name}>{city.name}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Visibilidad
            <input
              value={newListingForm.visibility}
              onChange={(event) => updateNewField("visibility", event.target.value)}
              placeholder="Configuración de visibilidad"
            />
          </label>
          <div style={{ gridColumn: '1 / -1', height: '300px', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
            <GoogleMapPicker
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              position={
                newListingForm.latitude && newListingForm.longitude
                  ? { lat: parseFloat(newListingForm.latitude), lng: parseFloat(newListingForm.longitude) }
                  : null
              }
              onChange={(coords) => {
                updateNewField("latitude", coords.lat);
                updateNewField("longitude", coords.lng);
              }}
            />
          </div>
        </div>
      </section>



      <div className="hostEditorSectionHeader">
        <h2>Comodidades</h2>
        <small>{Object.values(newListingForm.amenities).filter(Boolean).length} seleccionadas</small>
      </div>
      <section className="hostEditorCard hostAmenitiesCard">
        <div className="hostAmenitiesGrid">
          {amenityItems.map((item) => (
            <button
              key={item.id}
              className={`hostAmenityChip ${newListingForm.amenities[item.id] ? "isActive" : ""}`}
              type="button"
              onClick={() => toggleNewAmenity(item.id)}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
              <span className={`hostAmenityCheck ${newListingForm.amenities[item.id] ? "isSelected" : ""}`}>
                {newListingForm.amenities[item.id] ? <CheckCircle2 size={13} /> : null}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="hostEditorSectionHeader">
        <h2>Precio y disponibilidad</h2>
      </div>
      <section className="hostPricingGrid">
        <article className="hostPricingCard">
          <p>PRECIO BASE</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 10px' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3138' }}>$</span>
            <input
              type="text"
              className="hostPricingInput"
              style={{ margin: 0 }}
              value={(() => {
                const val = newListingForm.basePrice;
                if (!val) return '';
                const cleanStr = String(val).replace(/\D/g, '');
                if (!cleanStr) return '';
                const num = parseInt(cleanStr, 10);
                return isNaN(num) ? '' : num.toLocaleString('en-US');
              })()}
              onChange={(event) => {
                const rawValue = event.target.value.replace(/\D/g, '');
                updateNewField("basePrice", rawValue);
              }}
              placeholder="850"
            />
          </div>
        </article>

      </section>

      <div className="hostEditorSectionHeader">
        <h2>Fotos</h2>
      </div>
      <section className="hostEditorCard hostPhotosCard hostPhotosCardSingle">
        <input
          type="file"
          ref={newListingCoverPhotoRef}
          onChange={handleNewPhotoUpload}
          accept="image/*"
          hidden
          multiple={true}
        />
        <div className="hostPhotoAttachmentLayout">
          <button
            type="button"
            className={`hostUploadCard hostUploadCardLarge hostSinglePhotoDropzone ${newListingPhotos.length > 0 ? "hasContent" : ""}`}
            onClick={() => newListingCoverPhotoRef.current?.click()}
          >
            <Upload size={22} />
            <strong>{newListingPhotos.length > 0 ? "Subir más fotos" : "Subir fotos"}</strong>
            <span>Permite subir múltiples fotos</span>
          </button>

          <div className="hostPhotoAttachmentListWrap">
            <div className="hostPhotoAttachmentListHeader">
              <p>Fotos adjuntas</p>
              <span>{newListingPhotos.length}</span>
            </div>

            <div className="hostPhotoAttachmentList">
              {newListingPhotos.length > 0 ? (
                newListingPhotos.map((photo, index) => (
                  <article className="hostPhotoAttachmentItem" key={`${photo.name}-${index}`}>
                    <div className="hostPhotoAttachmentThumb">
                      <img src={photo.src} alt={photo.name} />
                    </div>
                    <div className="hostPhotoAttachmentMeta">
                      <strong>{photo.name}</strong>
                      <span>Adjuntada</span>
                    </div>
                    <button
                      type="button"
                      className="hostDeletePhotoBtn"
                      aria-label={`Eliminar foto ${index + 1}`}
                      onClick={() => removeNewPhoto(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="hostPhotoAttachmentEmpty">Sin fotos adjuntas.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="hostEditorSectionHeader hostEditorSectionHeaderSpaced">
        <h2>Modelo 360</h2>
      </div>
      <section className="hostEditorCard hostPanoramaCard">
        <div className="hostPhotoAttachmentLayout hostPanoramaAttachmentLayout">
          <EquirectangularUploader
            onValidImage={handlePanoramaValid}
            strict={false}
          />

          <div className="hostPhotoAttachmentListWrap">
            <div className="hostPhotoAttachmentListHeader">
              <p>Modelo 360 adjunto</p>
              <span>{newListingPanoramaPhotos.length}</span>
            </div>

            <div className="hostPhotoAttachmentList">
              {newListingPanoramaPhotos.length > 0 ? (
                newListingPanoramaPhotos.map((photo, index) => (
                  <article className="hostPhotoAttachmentItem" key={`${photo.name}-${index}`}>
                    <div className="hostPhotoAttachmentThumb">
                      <img src={photo.src} alt={photo.name} />
                    </div>
                    <div className="hostPhotoAttachmentMeta">
                      <strong>{photo.name}</strong>
                      <span>360° adjunta</span>
                    </div>
                    <button
                      type="button"
                      className="hostDeletePhotoBtn"
                      aria-label={`Eliminar imagen 360 ${index + 1}`}
                      onClick={() => removeNewPanoramaPhoto(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="hostPhotoAttachmentEmpty">Sin imágenes 360 adjuntas.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="hostEditorCard hostListingActionsCard">
        <button type="button" className="hostListingSecondaryBtn" onClick={() => handleSaveNewListing(true)}>Guardar borrador</button>
        <button type="button" className="hostListingPrimaryBtn" onClick={() => handleSaveNewListing(false)}>Continuar configuración</button>
      </section>
    </section>
  );

  const renderListingsEntry = () => {
    if (!listingAction) {
      return (
        <section className="hostListingChoiceWrap">
          <header className="hostEditorHeader">
            <p>Alojamientos</p>
            <h1>¿Qué quieres hacer?</h1>
            <span>Selecciona una opción antes de abrir los detalles del alojamiento.</span>
          </header>

          <div className="hostListingChoiceGrid">
            <button
              type="button"
              className="hostListingChoiceCard"
              onClick={() => setListingAction("edit-list")}
            >
              <h2>Editar alojamiento existente</h2>
              <p>Abre una propiedad registrada y actualiza los detalles, las fotos o el precio.</p>
            </button>

            <button
              type="button"
              className="hostListingChoiceCard"
              onClick={() => setListingAction("new")}
            >
              <h2>Registrar nuevo alojamiento</h2>
              <p>Crea un perfil nuevo y empieza el proceso de publicación.</p>
            </button>
          </div>
        </section>
      );
    }

    return (
      <>
        <button
          type="button"
          className="hostBackToChoiceBtn"
          onClick={() => setListingAction(null)}
        >
          ← Cambiar acción
        </button>
        {listingAction === "edit-list" ? renderRegisteredListingsView() : null}
        {listingAction === "edit" ? renderListingsView() : null}
        {listingAction === "new" ? renderNewListingView() : null}
      </>
    );
  };

  return (
    <div className="hostDashboardPage">
      {isProcessing && <DualLoader overlay />}
      <aside className="hostSidebar">
        <div className="hostBrandBlock">
  <p>Bienvenido, {displayName}</p>
  <img src={hostPhoto} alt="Perfil del anfitrión" className="hostBrandUserIcon" />
</div>

        <nav className="hostMainNav">
          {sidebarItems.map((item) => ( 
            
            <button
              key={item.id}
              className={`hostNavItem ${activeItem === item.id ? "isActive" : ""}`}
              type="button"
              onClick={() => handleSidebarSelect(item.id)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          className="hostAddPropertyBtn"
          type="button"
          onClick={() => {
            if (
              activeItem === "settings" &&
              settingsDirty
            ) {
              Swal.fire({
                title: '¿Estás seguro?',
                text: 'Tienes cambios sin guardar. Si sales, se perderán.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate("/");
                }
              });
              return;
            }
            navigate("/");
          }}
        >
          <Backpack size={16} />
          Modo Viajero
        </button>

        <div className="hostBottomNav">
          <button type="button" onClick={() => handleSidebarSelect("settings")}>
            <Settings size={15} />
            Ajustes
          </button>
          <button type="button" onClick={() => handleSidebarSelect("support")}>
            <LifeBuoy size={15} />
            Soporte
          </button>
        </div>

        <p className="hostSidebarCopyright">© 2026 Editorial Hospitality Lux.</p>
      </aside>

      <main className={`hostMain ${activeItem === "listings" || activeItem === "reservations" || activeItem === "messages" || activeItem === "settings" || activeItem === "support" ? "hostMainFixedPane" : ""}`}>
        {activeItem === "listings" ? renderListingsEntry() : null}
        {activeItem === "reservations" ? renderReservationsView() : null}
        {activeItem === "messages" ? <MessagesSection selectedGuestName={selectedMessageGuestName} /> : null}
        {activeItem === "earnings" ? renderEarningsView() : null}
        {activeItem === "settings" ? renderSettingsView() : null}
        {activeItem === "support" ? renderSupportView() : null}
        {activeItem === "dashboard" ? renderDashboardView() : null}
      </main>
    </div>
  );
}

export default HostDashboardPage;

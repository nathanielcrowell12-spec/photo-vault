import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  Clock,
  MapPin,
  ArrowRight,
  Navigation,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "2026 Madison WI Photography Guide | 30 Best Locations with Permits & Tips",
  description:
    "30 verified photography locations in Madison, WI with GPS coordinates, permit requirements, best times to shoot, and insider tips. Built by photographers, for photographers.",
  keywords:
    "Madison WI photography locations, Madison photo spots, Madison portrait locations, Madison wedding photography locations, Madison senior photos, Wisconsin photography guide",
  openGraph: {
    type: "article",
    title:
      "2026 Madison WI Photography Guide | 30 Best Locations with Permits & Tips",
    description:
      "30 verified photography locations in Madison, WI with GPS coordinates, permit requirements, insider tips, and seasonal timing advice.",
    url: "https://www.photovault.photo/resources/madison-photography-guide",
    siteName: "PhotoVault",
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 Madison WI Photography Guide | 30 Locations",
    description:
      "GPS coordinates, permit rules, best times, and insider tips for 30 Madison photo spots.",
  },
  alternates: {
    canonical: "https://www.photovault.photo/resources/madison-photography-guide",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.photovault.photo",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Resources",
      item: "https://www.photovault.photo/resources",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Madison Photography Guide",
      item: "https://www.photovault.photo/resources/madison-photography-guide",
    },
  ],
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline:
    "2026 Madison WI Photography Guide: 30 Best Locations with Permits & Tips",
  description:
    "30 verified photography locations in Madison, WI with GPS coordinates, permit requirements, best times to shoot, and insider tips.",
  author: {
    "@type": "Person",
    name: "Nate Crowell",
    jobTitle: "Founder",
    worksFor: { "@type": "Organization", name: "PhotoVault LLC" },
    url: "https://www.photovault.photo/about",
  },
  publisher: {
    "@type": "Organization",
    name: "PhotoVault",
    logo: {
      "@type": "ImageObject",
      url: "https://www.photovault.photo/images/logos/photovault-logo.png",
    },
  },
  datePublished: "2026-03-07",
  dateModified: "2026-03-07",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://www.photovault.photo/resources/madison-photography-guide",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a permit for photography in Madison?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on the location. Many Madison parks allow small portrait sessions (1-3 people) without a permit. However, locations like Olbrich Botanical Gardens require a permit ($100 for 2 hours) for all professional photography. The UW-Madison campus, including Memorial Union Terrace, prohibits commercial photography without a special events permit ($150+). Always check the specific location's rules before booking a session.",
      },
    },
    {
      "@type": "Question",
      name: "What are the best sunset photo spots in Madison?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The top sunset spots in Madison include Picnic Point (golden light on Lake Mendota), Olin Park (best unobstructed skyline view), Monona Terrace Rooftop (lake and skyline), and Pope Farm Conservancy (rolling prairie hills). For lakeside sunsets, Tenney Park and B.B. Clarke Beach also offer beautiful water reflections.",
      },
    },
    {
      "@type": "Question",
      name: "Where can I take engagement photos in Madison?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Popular engagement photo locations in Madison include the Wisconsin State Capitol (grand architecture), UW-Madison Arboretum (romantic nature trails), Picnic Point (lake views), Tenney Park (stone bridges and willow trees), Garver Feed Mill (rustic industrial), and Pope Farm Conservancy (sunflower fields in late summer). Each offers a unique aesthetic from urban elegance to natural romance.",
      },
    },
    {
      "@type": "Question",
      name: "Can I take professional photos at Memorial Union Terrace?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. UW-Madison has a strict policy against commercial photography at the Memorial Union Terrace. If you are shooting with a paying client, campus police will ask you to leave. Multiple photographers report being removed mid-shoot. Alternatives include Picnic Point (no restrictions, free) or obtaining a UW Special Events permit ($150+, 2-week lead time).",
      },
    },
    {
      "@type": "Question",
      name: "What are the best indoor photography locations in Madison for winter?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For winter indoor sessions in Madison, consider Madison Central Library (modern interiors, big windows), Olbrich Botanical Gardens Bolz Conservatory (tropical plants year-round, $2 admission), Garver Feed Mill (exposed brick and steel), and the Wisconsin State Capitol interior (marble rotunda, mosaic floors). Each requires varying levels of permission.",
      },
    },
  ],
};

const touristAttractionSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "30 Best Photography Locations in Madison, WI",
  description:
    "Curated list of the best photography locations in Madison, Wisconsin for portrait, wedding, engagement, and senior sessions.",
  numberOfItems: 30,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "TouristAttraction",
        name: "Wisconsin State Capitol",
        address: "2 E Main St, Madison, WI 53703",
        geo: { "@type": "GeoCoordinates", latitude: 43.0747, longitude: -89.3842 },
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "TouristAttraction",
        name: "UW-Madison Arboretum",
        address: "1207 Seminole Hwy, Madison, WI 53711",
        geo: { "@type": "GeoCoordinates", latitude: 43.039, longitude: -89.4251 },
      },
    },
    {
      "@type": "ListItem",
      position: 5,
      item: {
        "@type": "TouristAttraction",
        name: "Picnic Point",
        address: "Picnic Point Ln, Madison, WI 53705",
        geo: { "@type": "GeoCoordinates", latitude: 43.0865, longitude: -89.4194 },
      },
    },
    {
      "@type": "ListItem",
      position: 29,
      item: {
        "@type": "TouristAttraction",
        name: "Pope Farm Conservancy",
        address: "8214 CTH M, Middleton, WI 53562",
        geo: { "@type": "GeoCoordinates", latitude: 43.0667, longitude: -89.5667 },
      },
    },
  ],
};

interface LocationData {
  id: number;
  name: string;
  address: string;
  gps: string;
  bestFor: string[];
  shot: string;
  permits: { text: string; status: "allowed" | "denied" | "conditional" }[];
  permitContact?: string;
  bestTimes: string[];
  gotcha: string;
  tips: string[];
  difficulty: string;
  accessibility: string;
  restrooms: string;
  warning?: string;
}

const locations: LocationData[] = [
  {
    id: 1,
    name: "Wisconsin State Capitol",
    address: "2 E Main St, Madison, WI 53703",
    gps: "43.0747\u00b0 N, 89.3842\u00b0 W",
    bestFor: ["Weddings", "Engagements", "Senior Portraits", "Architectural"],
    shot: "Grand white granite exterior, magnificent staircases, commanding dome. Inside: marble rotunda, mosaic floors, sweeping staircases. The Capitol offers timeless, elegant backdrops that photograph well year-round.",
    permits: [
      { text: "No permit needed for small portrait sessions (1-3 people)", status: "allowed" },
      { text: "Permit required for weddings or large groups", status: "denied" },
    ],
    permitContact: "Wisconsin State Capitol Police (608-266-7541)",
    bestTimes: [
      "Exterior: Late afternoon (4-6pm) for warm light on west-facing granite steps",
      "Interior: Weekdays 8am-10am (before tourist crowds)",
      "Avoid: Weekends during legislative session (Jan-May) - very crowded",
    ],
    gotcha: "Security is strict. Don't bring large equipment bags, tripods, or reflectors without clearing it first. They WILL stop you.",
    tips: [
      "The north-facing steps get beautiful diffused light all day",
      "Martin Luther King Jr. Blvd side has less foot traffic than State Street side",
      "Free 2-hour street parking on weekends",
    ],
    difficulty: "Easy",
    accessibility: "Wheelchair accessible",
    restrooms: "Yes (inside Capitol)",
  },
  {
    id: 2,
    name: "UW-Madison Arboretum",
    address: "1207 Seminole Hwy, Madison, WI 53711",
    gps: "43.0390\u00b0 N, 89.4251\u00b0 W",
    bestFor: ["Engagements", "Maternity", "Nature Portraits", "Romantic"],
    shot: "1,200 acres of diverse landscapes. Winding trails through tall trees, prairie meadows, Curtis Prairie in golden hour, secluded forest clearings. Romantic without trying too hard.",
    permits: [
      { text: "No permit needed for personal/small portrait sessions", status: "allowed" },
      { text: "Permit required for commercial shoots or weddings", status: "denied" },
    ],
    permitContact: "arboretum@wisc.edu or call (608) 263-7888",
    bestTimes: [
      "Spring: April-May (wildflowers, fresh green)",
      "Fall: Late September-October (fall colors peak)",
      "Golden hour: 1 hour before sunset (prairie glows)",
      "Avoid: Midday summer (harsh light, buggy)",
    ],
    gotcha: "Trails close at dusk. If you're shooting sunset, you need to hustle out before they lock the gates. Security WILL find you.",
    tips: [
      "Curtis Prairie (southwest section) = best sunset light",
      "Longenecker Horticultural Gardens = manicured, less \"wild\" look",
      "Free parking at multiple trailheads",
      "Bug spray in summer is NON-NEGOTIABLE",
    ],
    difficulty: "Easy to Moderate (some trails are uneven)",
    accessibility: "Limited (main paths only)",
    restrooms: "Yes (visitor center)",
  },
  {
    id: 3,
    name: "Memorial Union Terrace",
    address: "800 Langdon St, Madison, WI 53706",
    gps: "43.0769\u00b0 N, 89.3987\u00b0 W",
    bestFor: ["Iconic Madison Vibe", "Colorful Sunburst Chairs", "Lake Views"],
    shot: "Famous colorful sunburst chairs, Lake Mendota backdrop, sailboats, classic Wisconsin summer feel. Highly Instagrammable.",
    permits: [
      { text: "NO COMMERCIAL PHOTOGRAPHY ALLOWED", status: "denied" },
      { text: "UW-Madison strict policy - campus police will ask you to leave", status: "denied" },
    ],
    permitContact: "Union South Events (608-890-3000)",
    bestTimes: [
      "Late afternoon (4-6pm) for golden light on chairs",
      "Sunset over the lake (west-facing)",
    ],
    gotcha: "Photographers get burned by this constantly. Every \"best Madison photo spots\" list includes the Terrace, but none mention the commercial policy. Don't be that photographer.",
    tips: [
      "Shoot at nearby Picnic Point instead (no restrictions)",
      "Or get a UW Special Events permit ($150+, 2-week lead time)",
      "Personal/family photos for non-commercial use are fine",
    ],
    difficulty: "Easy",
    accessibility: "Wheelchair accessible",
    restrooms: "Yes (inside Union)",
    warning: "NO COMMERCIAL PHOTOGRAPHY - Read permit details carefully before planning any paid sessions here.",
  },
  {
    id: 4,
    name: "Olbrich Botanical Gardens",
    address: "3330 Atwood Ave, Madison, WI 53704",
    gps: "43.1058\u00b0 N, 89.3267\u00b0 W",
    bestFor: ["Weddings", "Engagements", "Botanical Elegance", "Tropical Conservatory"],
    shot: "16 acres of outdoor gardens + indoor Bolz Conservatory (tropical plants, waterfall, koi pond). Lush, romantic, magazine-worthy backdrops.",
    permits: [
      { text: "Permit REQUIRED for all professional photography", status: "denied" },
      { text: "Fee: $100 for 2-hour session", status: "conditional" },
    ],
    permitContact: "Reservations: 2 weeks advance, call (608) 246-4550",
    bestTimes: [
      "Spring: May (tulips, flowering trees)",
      "Summer: June-August (rose garden peak)",
      "Fall: September (dahlias, fall foliage)",
      "Indoor conservatory: Year-round (climate-controlled)",
    ],
    gotcha: "They are STRICT about permits. If you show up with a camera and a couple in a wedding dress, they will stop you and charge you on the spot. Book ahead.",
    tips: [
      "Thai Pavilion = most popular backdrop (book early)",
      "Conservatory is $2 admission per person (include in your pricing)",
      "Outdoor gardens close at dusk",
      "Weekend mornings = fewer crowds",
    ],
    difficulty: "Easy",
    accessibility: "Wheelchair accessible (outdoor paths)",
    restrooms: "Yes (garden center)",
  },
  {
    id: 5,
    name: "Picnic Point",
    address: "Picnic Point Ln, Madison, WI 53705",
    gps: "43.0865\u00b0 N, 89.4194\u00b0 W",
    bestFor: ["Sunset Sessions", "Nature Walks", "Lake Views", "Casual/Romantic"],
    shot: "Long, narrow peninsula jutting into Lake Mendota. Tree-lined path, Madison skyline views across the water, secluded feel despite being on campus. Classic \"Wisconsin nature walk\" vibe.",
    permits: [
      { text: "No permit needed for portrait sessions", status: "allowed" },
      { text: "FREE and accessible to public", status: "allowed" },
    ],
    bestTimes: [
      "Sunset: 1 hour before sunset (golden light on water)",
      "Spring/Fall: Best weather, beautiful colors",
      "Avoid: Winter (icy, cold, brutal wind off the lake)",
    ],
    gotcha: "It's a 20-minute walk from parking to the point. Clients in heels? Bring flats for the walk. Also, it's WINDY. Bring hair ties.",
    tips: [
      "Park at Lot 60 (end of Lakeshore Path)",
      "Fire pit at the point (cool prop for engagement shots)",
      "Sunset timing: Check weather.gov (lake reflects golden hour beautifully)",
      "Bring bug spray in summer",
    ],
    difficulty: "Easy (but long walk)",
    accessibility: "Paved path (wheelchair accessible)",
    restrooms: "No (use before you go)",
  },
  {
    id: 6,
    name: "Tenney Park",
    address: "402 N Thornton Ave, Madison, WI 53703",
    gps: "43.0907\u00b0 N, 89.3732\u00b0 W",
    bestFor: ["Engagements", "Families", "Seniors", "Winter Sessions"],
    shot: "Stone bridges, calm lagoon, willow trees, and open shoreline along Lake Mendota. Easy to move around and find diverse looks in one session.",
    permits: [
      { text: "No permit required for small portrait sessions", status: "allowed" },
      { text: "Large/commercial groups may require Parks permit", status: "conditional" },
    ],
    permitContact: "Madison Parks (608) 266-4711",
    bestTimes: [
      "Sunrise = calm water + low traffic",
      "Fall = blazing color + fog over lagoon",
      "Winter = frozen lake + bridge shots",
    ],
    gotcha: "Goose droppings everywhere in summer \u2014 choose footwear wisely.",
    tips: [
      "Stone footbridge = best backdrop",
      "Lagoon freezes early \u2192 great winter look",
      "Golden hour hits willow tree clusters beautifully",
    ],
    difficulty: "Easy",
    accessibility: "Good \u2014 paved paths",
    restrooms: "Yes (seasonal)",
  },
  {
    id: 7,
    name: "Vilas Park + Zoo Area",
    address: "702 S Randall Ave, Madison, WI 53715",
    gps: "43.0584\u00b0 N, 89.4033\u00b0 W",
    bestFor: ["Family Sessions", "Kids", "Couples", "Urban-Nature Mix"],
    shot: "Lake Wingra shoreline, tall trees, quaint footbridge, charming older houses in surrounding streets. Massive seasonal variety.",
    permits: [
      { text: "No permit needed for small portrait sessions", status: "allowed" },
      { text: "Zoo exterior areas okay without permit", status: "allowed" },
      { text: "No photography inside zoo animal exhibits unless pre-approved", status: "denied" },
    ],
    bestTimes: [
      "Morning \u2192 calm water",
      "Fall \u2192 peak reds/oranges",
      "Snow \u2192 postcard look",
    ],
    gotcha: "Road + parking fills fast on weekends.",
    tips: [
      "The little footbridge by the lagoon = ideal",
      "Tree alley toward Monroe St = killer depth shots",
      "Walk 3-5 blocks for charming white/brick homes",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Yes (seasonal)",
  },
  {
    id: 8,
    name: "Olin Park / Olin Turville",
    address: "1156 Olin-Turville Ct, Madison, WI 53715",
    gps: "43.0549\u00b0 N, 89.3828\u00b0 W",
    bestFor: ["Skyline Portraits", "Engagements", "Seniors", "Sunset"],
    shot: "Best unobstructed Madison skyline view from land. Fields, paths, tall grasses, and oak groves.",
    permits: [
      { text: "Small portrait sessions allowed", status: "allowed" },
      { text: "Large paid groups may require permit", status: "conditional" },
    ],
    permitContact: "Madison Parks (608) 266-4711",
    bestTimes: [
      "Sunset: Skyline glows \u2192 primary reason to come here",
    ],
    gotcha: "Windy \u2014 hair control becomes a thing.",
    tips: [
      "Shoreline grass gives nice depth",
      "Great for silhouettes at sunset",
      "Bring a longer lens to compress skyline",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Limited",
  },
  {
    id: 9,
    name: "Bassett & Washington Warehouse District",
    address: "W Washington Ave & S Bassett St, Madison, WI",
    gps: "43.0683\u00b0 N, 89.3916\u00b0 W",
    bestFor: ["Editorial", "Street Portraits", "Branding"],
    shot: "Industrial brick, alley textures, loading docks, gritty urban tones rarely seen on Madison lists. Perfect for fashion + branding sessions.",
    permits: [
      { text: "No permit for sidewalks/alleys", status: "allowed" },
      { text: "Private loading docks = ask permission", status: "conditional" },
    ],
    bestTimes: [
      "Late afternoon \u2192 soft reflective light",
      "Cloudy days help soften harsh alley shadows",
    ],
    gotcha: "Delivery traffic. Stay alert.",
    tips: [
      "Great for film-style portraiture",
      "Look for painted brick + rusted metal textures",
      "Night shots with street lights = moody",
    ],
    difficulty: "Easy",
    accessibility: "Paved",
    restrooms: "No",
  },
  {
    id: 10,
    name: "Madison Central Library",
    address: "201 W Mifflin St, Madison, WI 53703",
    gps: "43.0737\u00b0 N, 89.3901\u00b0 W",
    bestFor: ["Headshots", "Editorial", "Winter Sessions", "Modern/Architectural"],
    shot: "Clean, modern interiors. Big windows for contemporary natural-light portraits. Interesting staircases + metal/wood details.",
    permits: [
      { text: "MUST request permission for professional/paid shoots", status: "conditional" },
      { text: "Staff typically allows small, quiet sessions", status: "allowed" },
    ],
    permitContact: "(608) 266-6300",
    bestTimes: [
      "Weekday mornings \u2014 fewer people",
    ],
    gotcha: "Need to stay out of high-traffic reading areas.",
    tips: [
      "Third floor stacks \u2192 warm tones + symmetry",
      "Glass stair rails = sleek portrait backdrops",
      "Winter-friendly option",
    ],
    difficulty: "Easy",
    accessibility: "Excellent",
    restrooms: "Yes",
  },
  {
    id: 11,
    name: "Alliant Energy Center Grounds",
    address: "1919 Alliant Energy Center Way, Madison, WI 53713",
    gps: "43.0448\u00b0 N, 89.3763\u00b0 W",
    bestFor: ["Seniors", "Branding", "Large-Group Portraits", "Industrial"],
    shot: "Wide concrete spaces, long leading lines, metal structures, grassy buffers \u2014 a flexible hybrid of industrial + minimalistic outdoor looks.",
    permits: [
      { text: "Outdoor casual/small portrait sessions usually OK", status: "allowed" },
      { text: "Professional shoots may require permission \u2014 case-by-case", status: "conditional" },
    ],
    permitContact: "(608) 267-3976",
    bestTimes: [
      "Sunset \u2014 warm tones over open pavement",
      "Cloudy = ideal soft industrial look",
    ],
    gotcha: "During big events (concerts/fairs), access is limited or fenced.",
    tips: [
      "The south end has clean concrete + metal backdrop",
      "Great for full-body branding shots",
      "Minimal foot traffic \u2192 stress-free shooting",
    ],
    difficulty: "Easy",
    accessibility: "Excellent",
    restrooms: "Event-dependent",
  },
  {
    id: 12,
    name: "James Madison Park",
    address: "614 E Gorham St, Madison, WI 53703",
    gps: "43.0792\u00b0 N, 89.3805\u00b0 W",
    bestFor: ["Couples", "Families", "Seniors", "Lakeside Portraits"],
    shot: "Gorgeous Lake Mendota shoreline + open lawn + historic Gates of Heaven building (stone synagogue) for classic, architectural contrast.",
    permits: [
      { text: "Small shoots OK", status: "allowed" },
      { text: "Permit required for use of Gates of Heaven building interior", status: "conditional" },
    ],
    permitContact: "Madison Parks (608) 266-4711",
    bestTimes: [
      "Sunrise \u2192 calm water + empty park",
      "Afternoon \u2192 harsher but doable with reflectors",
    ],
    gotcha: "Wind and lake spray \u2014 hair management needed.",
    tips: [
      "Use the stone synagogue for vintage look",
      "Long lens \u2192 compress lake beautifully",
      "Great winter ice shots (when safe)",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Seasonal",
  },
  {
    id: 13,
    name: "Monona Terrace Rooftop",
    address: "1 John Nolen Dr, Madison, WI 53703",
    gps: "43.0703\u00b0 N, 89.3829\u00b0 W",
    bestFor: ["Weddings", "Seniors", "Engagements", "Skyline Shots"],
    shot: "Modern architecture + sweeping views of Lake Monona + curved lines + glass. Very clean, bright aesthetic.",
    permits: [
      { text: "Professional photography may require approval", status: "conditional" },
      { text: "Events have priority \u2192 avoid wedding/event blocks", status: "conditional" },
    ],
    permitContact: "(608) 261-4093",
    bestTimes: [
      "Sunset \u2192 gold on water + skyline",
      "Blue hour \u2192 city glow",
    ],
    gotcha: "Rooftop can be closed for private events \u2014 always check first.",
    tips: [
      "Lakefront terrace walkway below also excellent",
      "Curved walls create great negative space",
      "Strong wind \u2014 minimal props",
    ],
    difficulty: "Easy",
    accessibility: "Excellent",
    restrooms: "Yes",
  },
  {
    id: 14,
    name: "Law Park (Lake Monona Shoreline)",
    address: "410 S Blair St, Madison, WI 53703",
    gps: "43.0708\u00b0 N, 89.3734\u00b0 W",
    bestFor: ["Couples", "Seniors", "Small Weddings", "Skyline Shots"],
    shot: "Lake Monona boardwalk, skyline behind, grassy patches + bikeway minimalism. Clean + classic.",
    permits: [
      { text: "Small portrait sessions allowed", status: "allowed" },
    ],
    bestTimes: [
      "Evening \u2192 skyline glows",
      "Sunrise \u2192 soft, dreamy water",
    ],
    gotcha: "Busy bike path \u2014 timing is key.",
    tips: [
      "Bring longer focal length to compress skyline",
      "Use retaining wall along path for clean lines",
      "Great backup when Monona Terrace is booked",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "No",
  },
  {
    id: 15,
    name: "Garver Feed Mill",
    address: "3241 Garver Green, Madison, WI 53704",
    gps: "43.0957\u00b0 N, 89.3233\u00b0 W",
    bestFor: ["Engagements", "Editorial", "Branding", "Rustic Industrial"],
    shot: "Restored historic feed mill \u2192 exposed brick, black steel, glass, artisan spaces. One of Madison's hottest wedding + photo backdrops.",
    permits: [
      { text: "Indoor professional photography requires permission", status: "conditional" },
      { text: "Some outdoor areas public; others private tenant space", status: "conditional" },
    ],
    permitContact: "info@garverfeedmill.com",
    bestTimes: [
      "Late afternoon \u2192 soft brick glow",
      "Cloudy \u2192 perfect industrial mood",
    ],
    gotcha: "Indoor areas are tenant-controlled \u2014 don't assume access.",
    tips: [
      "East side path behind building \u2192 dreamy evening light",
      "Great winter option for indoor/outdoor hybrid",
      "Parking fills fast on weekends",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Yes (inside vendors)",
  },
  {
    id: 16,
    name: "Henry Vilas Beach (Lake Wingra Shore)",
    address: "Near 1601 Vilas Park Dr, Madison, WI 53715",
    gps: "43.0562\u00b0 N, 89.4136\u00b0 W",
    bestFor: ["Couples", "Families", "Lifestyle", "Summer Sessions"],
    shot: "Quiet, natural lakeshore tucked behind Vilas Park. Soft sand, willow trees, and clear sunset views. One of Madison's most underrated lakeside gems.",
    permits: [
      { text: "No permit needed for portrait sessions", status: "allowed" },
      { text: "Avoid large paid groups (consider Parks permit if >6 people)", status: "conditional" },
    ],
    permitContact: "Madison Parks (608) 266-4711",
    bestTimes: [
      "Sunset for reflections on Lake Wingra",
      "Early morning for glass-still water",
    ],
    gotcha: "Mosquitoes at dusk \u2014 bring repellant.",
    tips: [
      "Use the shoreline trees for natural framing",
      "Hidden benches for intimate poses",
      "Combine with nearby Vilas Park for variety",
    ],
    difficulty: "Easy",
    accessibility: "Moderate (uneven shoreline)",
    restrooms: "Seasonal",
  },
  {
    id: 17,
    name: "Capitol Square / State Street Loop",
    address: "From Capitol steps down State Street to Library Mall",
    gps: "43.0749\u00b0 N, 89.3867\u00b0 W",
    bestFor: ["Branding", "Street", "Engagement", "Seniors"],
    shot: "Urban energy \u2014 brick fa\u00e7ades, neon lights, storefront reflections, Capitol dome framing State Street. Perfect for downtown lifestyle shoots.",
    permits: [
      { text: "Public sidewalks OK", status: "allowed" },
      { text: "Avoid private shopfront interiors without permission", status: "denied" },
    ],
    bestTimes: [
      "Golden hour \u2192 warm storefront reflections",
      "Night \u2192 bokeh lights, cinematic look",
    ],
    gotcha: "Heavy pedestrian traffic \u2014 plan off-hours (Sunday morning ideal).",
    tips: [
      "Use telephoto lens to compress dome view",
      "Mifflin and King streets = quieter cross streets",
      "Great winter night shots with holiday lights",
    ],
    difficulty: "Moderate",
    accessibility: "Excellent",
    restrooms: "Businesses nearby",
  },
  {
    id: 18,
    name: "Warner Park",
    address: "2930 N Sherman Ave, Madison, WI 53704",
    gps: "43.1290\u00b0 N, 89.3654\u00b0 W",
    bestFor: ["Families", "Kids", "Nature Portraits", "Engagements"],
    shot: "Open fields, pines, shoreline trails, and the lagoon. Spacious, calm, ideal for golden-hour family shoots.",
    permits: [
      { text: "Portrait sessions OK", status: "allowed" },
      { text: "Large paid groups \u2192 Parks permit", status: "conditional" },
    ],
    permitContact: "Madison Parks (608) 266-4711",
    bestTimes: [
      "Evening golden hour over the lagoon",
      "Autumn foliage = vivid orange tones",
    ],
    gotcha: "Baseball games = full parking lots; plan around events.",
    tips: [
      "Lagoon footbridge for symmetry shots",
      "Pine grove near north end = dreamy backlight",
      "Ample open space for long-lens depth",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Seasonal",
  },
  {
    id: 19,
    name: "B.B. Clarke Beach",
    address: "835 Spaight St, Madison, WI 53703",
    gps: "43.0782\u00b0 N, 89.3705\u00b0 W",
    bestFor: ["Seniors", "Engagements", "Water-Edge Portraits"],
    shot: "Tucked-away neighborhood beach with wooden pier, willow canopy, and intimate feel. Looks like a Northwoods hideaway five minutes from downtown.",
    permits: [
      { text: "Small sessions OK", status: "allowed" },
      { text: "No tripods blocking walkway", status: "conditional" },
    ],
    bestTimes: [
      "Sunset for soft lake glow",
      "Early morning \u2192 mist over Monona",
    ],
    gotcha: "Limited parking; come early.",
    tips: [
      "Short pier perfect for symmetry compositions",
      "Nearby Yahara Place Park = bonus greenery",
      "Great quiet alternative to Law Park",
    ],
    difficulty: "Easy",
    accessibility: "Moderate (stairs)",
    restrooms: "Seasonal",
  },
  {
    id: 20,
    name: "Goodman Community Center / Atwood Corridor",
    address: "149 Waubesa St, Madison, WI 53704",
    gps: "43.0912\u00b0 N, 89.3355\u00b0 W",
    bestFor: ["Urban", "Editorial", "Family", "Lifestyle"],
    shot: "Converted industrial buildings with ivy-covered brick, murals, bike path, and caf\u00e9-style charm. East-side vibe meets clean textures.",
    permits: [
      { text: "Outdoor public access fine", status: "allowed" },
      { text: "Indoor shoots require permission", status: "conditional" },
    ],
    permitContact: "(608) 241-1574",
    bestTimes: [
      "Late afternoon light on brick walls",
      "Morning \u2192 cool industrial tones",
    ],
    gotcha: "Busy weekends \u2014 lots of bikers/pedestrians.",
    tips: [
      "Murals behind main building = excellent backdrops",
      "Great coffee stops for lifestyle props",
      "Walk the nearby Capital City Trail for extended looks",
    ],
    difficulty: "Easy",
    accessibility: "Excellent",
    restrooms: "Yes (inside center)",
  },
  {
    id: 21,
    name: "Yahara Place Park (Riverwalk)",
    address: "1300-1500 Yahara Pl, Madison, WI 53703",
    gps: "43.0789\u00b0 N, 89.3648\u00b0 W",
    bestFor: ["Couples", "Families", "Seniors", "Quiet Waterfront"],
    shot: "A tranquil riverwalk lining the Yahara River with willow trees, short docks, and intimate grassy banks. Very serene \u2014 perfect for timeless, natural portraits.",
    permits: [
      { text: "Small portrait sessions OK", status: "allowed" },
      { text: "No blocking docks / paths", status: "conditional" },
    ],
    bestTimes: [
      "Early morning \u2192 still water + fog",
      "Sunset \u2192 warm reflection across river",
    ],
    gotcha: "Very limited shooting angles \u2014 small space.",
    tips: [
      "Short piers = leading-line compositions",
      "Willows create beautiful soft backdrops",
      "Combine with nearby BB Clarke Beach for variety",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "No",
  },
  {
    id: 22,
    name: "Burrows Park Boathouse",
    address: "25 Burrows Rd, Madison, WI 53704",
    gps: "43.1004\u00b0 N, 89.3643\u00b0 W",
    bestFor: ["Engagements", "Seniors", "Moody Lake Portraits"],
    shot: "Historic stone boathouse jutting into Lake Mendota. Natural + architectural hybrid. Perfect for dramatic lake-edge images.",
    permits: [
      { text: "Small portrait sessions OK", status: "allowed" },
      { text: "Boathouse interior generally not accessible", status: "conditional" },
    ],
    bestTimes: [
      "Sunrise \u2014 lake fog = magic",
      "Blue hour \u2014 reflection + structure silhouette",
    ],
    gotcha: "Wind off Mendota can be intense \u2014 bring hair plan.",
    tips: [
      "Shoot from side angle to feature stone textures",
      "Trees behind building soften harsh frames",
      "Winter \u2192 frozen lake = unique platform",
    ],
    difficulty: "Easy",
    accessibility: "Moderate",
    restrooms: "No",
  },
  {
    id: 23,
    name: "Alliant Energy Center \u2013 Willow Island",
    address: "1919 Alliant Energy Center Way, Madison, WI 53713",
    gps: "43.0466\u00b0 N, 89.3750\u00b0 W",
    bestFor: ["Families", "Couples", "Maternity", "Natural Landscapes"],
    shot: "A quiet, scenic peninsula on Lake Monona \u2014 tall grasses, open water, peaceful walking paths. Nature feel without leaving town.",
    permits: [
      { text: "Casual portrait sessions generally OK", status: "allowed" },
      { text: "Events take priority \u2014 check ahead", status: "conditional" },
    ],
    bestTimes: [
      "Sunset \u2192 warm glow + water reflection",
      "Morning \u2192 mist",
    ],
    gotcha: "Can be fenced off during events.",
    tips: [
      "Tall grasses \u2192 dreamy backlit shots",
      "Long lens to compress city shoreline",
      "Bring blanket \u2014 wide nature looks",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Event-dependent",
  },
  {
    id: 24,
    name: "Hilldale Shopping Center",
    address: "726 N Midvale Blvd, Madison, WI 53705",
    gps: "43.0797\u00b0 N, 89.4530\u00b0 W",
    bestFor: ["Branding", "Lifestyle", "Fashion", "Editorial"],
    shot: "Modern open-air shopping center with upscale storefronts, string lights, clean lines, and parking-deck skyline peeks. Great for commercial branding & lifestyle shoots.",
    permits: [
      { text: "Technically private property", status: "conditional" },
      { text: "Small, low-impact sessions often tolerated", status: "allowed" },
    ],
    permitContact: "Hilldale management (608) 238-6353",
    bestTimes: [
      "Golden hour \u2192 beautiful building bounce",
      "Night \u2192 string lights + signage glow",
    ],
    gotcha: "Weekends busy \u2192 go early.",
    tips: [
      "Sidewalk seating areas = relaxed lifestyle energy",
      "Parking deck \u2192 skyline + negative space",
      "Use storefront reflections for creative shots",
    ],
    difficulty: "Easy",
    accessibility: "Excellent",
    restrooms: "Yes (inside shops)",
  },
  {
    id: 25,
    name: "Hoyt Park",
    address: "3902 Regent St, Madison, WI 53705",
    gps: "43.0728\u00b0 N, 89.4503\u00b0 W",
    bestFor: ["Seniors", "Families", "Engagements", "Woodsy Portraits"],
    shot: "Rustic stone shelter, winding wooded trails, tall pines, mossy stone steps \u2014 feels like a Northwoods getaway inside the city.",
    permits: [
      { text: "Small portrait sessions allowed", status: "allowed" },
      { text: "Shelter rentals require permit", status: "denied" },
    ],
    bestTimes: [
      "Late afternoon \u2192 warm forest glow",
      "Fall \u2192 golden canopy",
    ],
    gotcha: "Low light in deep woods \u2014 fast lens recommended.",
    tips: [
      "Stone shelter = dramatic backdrop",
      "Pine stands provide tall, moody texture",
      "Great foggy-morning location",
    ],
    difficulty: "Moderate (hilly)",
    accessibility: "Limited",
    restrooms: "Seasonal",
  },
  {
    id: 26,
    name: "Lakeshore Nature Preserve \u2013 Frautschi Point",
    address: "2002 University Bay Dr, Madison, WI 53705",
    gps: "43.1011\u00b0 N, 89.4478\u00b0 W",
    bestFor: ["Engagements", "Outdoorsy Couples", "Families"],
    shot: "Secluded woodland point overlooking Lake Mendota, with natural trails, evergreens, and unobstructed water views. Quiet + romantic.",
    permits: [
      { text: "Casual portrait sessions OK", status: "allowed" },
      { text: "Large commercial setups discouraged", status: "denied" },
    ],
    bestTimes: [
      "Sunset \u2192 glow over water",
      "Dawn \u2192 quiet + mist",
    ],
    gotcha: "Parking limited; trails can be muddy after rain.",
    tips: [
      "Benches with lake views = intimate feels",
      "Fallen trees make great posing elements",
      "Pair with Picnic Point for variety",
    ],
    difficulty: "Moderate",
    accessibility: "Limited",
    restrooms: "No",
  },
  {
    id: 27,
    name: "Elver Park",
    address: "1250 McKenna Blvd, Madison, WI 53719",
    gps: "43.0394\u00b0 N, 89.5097\u00b0 W",
    bestFor: ["Families", "Maternity", "Nature Sessions"],
    shot: "Madison's largest community park: rolling hills, tall grasses, woodland edges, bridges, and surprisingly varied terrain.",
    permits: [
      { text: "Small shoots OK", status: "allowed" },
      { text: "Large commercial groups \u2192 Parks permit", status: "conditional" },
    ],
    bestTimes: [
      "Golden hour \u2192 tall grass glows beautifully",
      "Early fall \u2192 peak color",
    ],
    gotcha: "Big sledding hill = crowded on snow days.",
    tips: [
      "Grassy hills \u2192 wide scenic shots",
      "Wooded edges = soft filtered light",
      "Great space for kids to roam naturally",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Seasonal",
  },
  {
    id: 28,
    name: "Monona Bay Boardwalk (Brittingham Park)",
    address: "701 Brittingham Pl, Madison, WI 53715",
    gps: "43.0619\u00b0 N, 89.3896\u00b0 W",
    bestFor: ["Couples", "Families", "Seniors", "Shoreline Portraits"],
    shot: "Wooden boardwalk along Monona Bay with skyline reflections, sailboats, open water, and grassy park space.",
    permits: [
      { text: "Small portrait sessions allowed", status: "allowed" },
      { text: "No tripods blocking walkway", status: "conditional" },
    ],
    bestTimes: [
      "Sunset \u2192 stunning water reflections",
      "Blue hour \u2192 skyline lights",
    ],
    gotcha: "Lots of joggers + bikers \u2192 off-peak best.",
    tips: [
      "Use the curve in the boardwalk for strong leading lines",
      "Minimalist water compositions \u2192 elegant portraits",
      "Bring longer lens to compress skyline",
    ],
    difficulty: "Easy",
    accessibility: "Good",
    restrooms: "Limited / seasonal",
  },
  {
    id: 29,
    name: "Pope Farm Conservancy",
    address: "8214 CTH M, Middleton, WI 53562",
    gps: "43.0667\u00b0 N, 89.5667\u00b0 W",
    bestFor: ["Engagement Sessions", "Families", "Nature Portraits", "Sunflower Season"],
    shot: "105 acres of rolling hills, prairie restorations, and seasonally, massive sunflower fields. Wide-open pastoral beauty.",
    permits: [
      { text: "Small portrait sessions generally OK", status: "allowed" },
      { text: "Sunflower season often requires ticketed entry", status: "conditional" },
    ],
    permitContact: "Middleton Parks (608) 821-8370",
    bestTimes: [
      "Late July-August: Sunflower bloom (confirm timing annually)",
      "Golden hour: Prairie glows beautifully",
      "Fall: Autumn colors on rolling hills",
    ],
    gotcha: "Sunflower event is TICKETED and sells out fast. Plan months ahead.",
    tips: [
      "Arrive early during sunflower season (crowds + parking)",
      "Rolling hills create natural depth",
      "Bring wide-angle lens for field shots",
    ],
    difficulty: "Easy",
    accessibility: "Moderate (gravel paths, hills)",
    restrooms: "Seasonal",
  },
  {
    id: 30,
    name: "Pheasant Branch Conservancy",
    address: "3100 Century Ave, Middleton, WI 53562",
    gps: "43.1167\u00b0 N, 89.5333\u00b0 W",
    bestFor: ["Nature Portraits", "Families", "Adventurous Sessions"],
    shot: "160 acres with rivers, boardwalks, hiking trails, fields, and forests. A true nature escape just outside Madison.",
    permits: [
      { text: "Portrait sessions allowed", status: "allowed" },
      { text: "Respect wildlife areas", status: "conditional" },
    ],
    bestTimes: [
      "Spring: Wildflowers, flowing creeks",
      "Fall: Vibrant foliage",
      "Golden hour: Fields and boardwalks glow",
    ],
    gotcha: "Trails can be muddy \u2014 appropriate footwear essential.",
    tips: [
      "Boardwalk sections = unique elevated angles",
      "Creek areas perfect for adventurous couples",
      "Less crowded than Arboretum",
    ],
    difficulty: "Moderate (uneven terrain)",
    accessibility: "Limited",
    restrooms: "Yes (at trailhead)",
  },
];

function PermitIcon({ status }: { status: "allowed" | "denied" | "conditional" }) {
  if (status === "allowed") {
    return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />;
  }
  if (status === "denied") {
    return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />;
  }
  return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />;
}

function LocationCard({ location }: { location: LocationData }) {
  return (
    <section id={`location-${location.id}`} className="scroll-mt-24">
      <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg flex-shrink-0">
                {location.id}
              </span>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {location.name}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {location.address}
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3.5 w-3.5" />
                    {location.gps}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning banner */}
            {location.warning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {location.warning}
                </p>
              </div>
            )}

            {/* Best For tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {location.bestFor.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <Camera className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* The Shot */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              The Shot
            </h3>
            <p className="text-foreground/90 leading-relaxed">{location.shot}</p>
          </div>

          {/* Two-column grid for Permits and Best Times */}
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            {/* Permit Requirements */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Permit Requirements
              </h3>
              <ul className="space-y-1.5">
                {location.permits.map((permit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <PermitIcon status={permit.status} />
                    <span>{permit.text}</span>
                  </li>
                ))}
              </ul>
              {location.permitContact && (
                <p className="text-xs text-muted-foreground mt-2">
                  Contact: {location.permitContact}
                </p>
              )}
            </div>

            {/* Best Times */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                Best Times
              </h3>
              <ul className="space-y-1 text-sm">
                {location.bestTimes.map((time, i) => (
                  <li key={i} className="text-foreground/80">
                    {time}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The Gotcha */}
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  The Gotcha
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {location.gotcha}
                </p>
              </div>
            </div>
          </div>

          {/* Insider Tips */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Insider Tips
            </h3>
            <ul className="space-y-1">
              {location.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-primary mt-1">&#8226;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom badges */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              Difficulty: <span className="font-medium text-foreground">{location.difficulty}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              Accessibility: <span className="font-medium text-foreground">{location.accessibility}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              Restrooms: <span className="font-medium text-foreground">{location.restrooms}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function MadisonPhotographyGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(touristAttractionSchema),
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/resources/photo-storage-guide" className="hover:text-foreground">
            Resources
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Madison Photography Guide</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            The 2026 Madison, WI Photography Guide
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            30 Verified Locations with GPS Coordinates, Permit Rules, and Insider Tips
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>By Nate Crowell</span>
            <span>|</span>
            <time dateTime="2026-03-07">March 7, 2026</time>
            <span>|</span>
            <span>30 Locations</span>
          </div>
        </header>

        {/* Introduction */}
        <section className="mb-12">
          <Card className="border border-border/50">
            <CardContent className="p-6 sm:p-8">
              <p className="text-foreground/90 leading-relaxed mb-4">
                Madison is one of the most photogenic cities in the Midwest. But if you&apos;ve
                ever been kicked off a location mid-shoot, or arrived to find your &ldquo;perfect
                spot&rdquo; closed for a private event, you know the frustration.
              </p>
              <p className="text-foreground/90 leading-relaxed mb-4">
                This guide compiles everything Madison photographers need:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2 text-foreground/90">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  30 verified locations with GPS coordinates
                </li>
                <li className="flex items-center gap-2 text-foreground/90">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  Current permit requirements and rules
                </li>
                <li className="flex items-center gap-2 text-foreground/90">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  Seasonal timing and best light
                </li>
                <li className="flex items-center gap-2 text-foreground/90">
                  <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />
                  The &ldquo;gotchas&rdquo; nobody tells you about
                </li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                Built by photographers, for photographers.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Table of Contents */}
        <section className="mb-12" id="table-of-contents">
          <h2 className="text-2xl font-bold text-foreground mb-4">Table of Contents</h2>
          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {locations.map((loc) => (
                  <a
                    key={loc.id}
                    href={`#location-${loc.id}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1"
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                      {loc.id}
                    </span>
                    <span className="truncate">{loc.name}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Location Cards */}
        <div className="space-y-8">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mt-16 mb-12" id="faq">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqSchema.mainEntity.map((faq, i) => (
              <Card key={i} className="border border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">{faq.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 mb-12">
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Ready to Deliver Photos Like a Pro?
              </h2>
              <p className="text-muted-foreground mb-2 max-w-xl mx-auto">
                You know where to shoot. Now give your clients a gallery experience
                that matches your work &mdash; and earn passive income while you&apos;re at it.
              </p>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-sm">
                PhotoVault lets photographers deliver galleries and earn 50% commission
                on every client subscription. No monthly fees for you.
                Your clients pay &mdash; you earn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href="/auth/photographer-register">
                    Join as a Photographer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/resources/photographer-recurring-revenue">
                    Learn About Passive Income
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Related Resources */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Related Resources
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="border border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  How to Create Recurring Revenue as a Photographer
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Turn every gallery delivery into ongoing passive income.
                </p>
                <Link
                  href="/resources/photographer-recurring-revenue"
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Read Guide <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="border border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  PhotoVault vs ShootProof 2026
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Compare platforms side-by-side for your photography business.
                </p>
                <Link
                  href="/resources/photovault-vs-shootproof"
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Read Comparison <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
            <Card className="border border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">
                  PhotoVault vs Pixieset 2026
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Honest comparison of business models, features, and pricing.
                </p>
                <Link
                  href="/resources/photovault-vs-pixieset"
                  className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                >
                  Read Comparison <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <a
            href="#table-of-contents"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Back to Table of Contents
          </a>
        </div>
      </main>
    </div>
  );
}

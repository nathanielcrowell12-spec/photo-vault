// C:\Users\natha\.cursor\Photo Vault\photovault-hub\scripts\seed-madison-locations-data.ts
//
// Pure data module — no Supabase imports.
// Exports locationsData for use by the seed script and tests.

export const locationsData = [
  // ── 1. Wisconsin State Capitol ──────────────────────────────────────
  {
    location: {
      name: 'Wisconsin State Capitol',
      slug: 'wisconsin-state-capitol',
      description:
        'Grand white granite exterior, magnificent staircases, commanding dome. Inside: marble rotunda, mosaic floors, sweeping staircases. The Capitol offers timeless, elegant backdrops that photograph well year-round.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'No permit needed for small portrait sessions (1-3 people). Permit required for weddings or large groups. Contact: Wisconsin State Capitol Police (608-266-7541).',
      rules_and_restrictions:
        "Security is strict. Don't bring large equipment bags, tripods, or reflectors without clearing it first. They WILL stop you.",
      seasonal_availability:
        'Best Times: Exterior: Late afternoon (4-6pm) for warm light on west-facing granite steps. Interior: Weekdays 8am-10am (before tourist crowds). Avoid: Weekends during legislative session (Jan-May) - very crowded.',
      insider_tips:
        'The north-facing steps get beautiful diffused light all day. Martin Luther King Jr. Blvd side has less foot traffic than State Street side. Free 2-hour street parking on weekends.',
      // new fields
      crowd_level: 'Moderate to high',
      accessibility:
        'Fully wheelchair-accessible. Elevator access to all floors inside. Ramps on north and south entrances.',
      parking:
        'Free 2-hour street parking on weekends. Metered street parking weekdays. Overture Center garage nearby ($3/hr).',
      drone_policy: 'Prohibited — state government building and restricted airspace.',
      amenities: 'Restrooms inside (public hours). Benches on Capitol Square. Water fountains on ground floor.',
      permit_personal: 'No permit needed for small portrait sessions (1-3 people).',
      permit_pro:
        'Required for weddings or large groups. Contact: Wisconsin State Capitol Police (608-266-7541).',
      admission_notes: 'Free admission. Public tours available.',
      booking_info: null,
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'capitol-square-state-street-loop',
        'james-madison-park',
        'monona-terrace-rooftop',
      ],
    },
  },

  // ── 2. UW-Madison Arboretum ─────────────────────────────────────────
  {
    location: {
      name: 'UW-Madison Arboretum',
      slug: 'uw-madison-arboretum',
      description:
        '1,200 acres of diverse landscapes. Winding trails through tall trees, prairie meadows, Curtis Prairie in golden hour, secluded forest clearings. Romantic without trying too hard.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields — CORRECTED
      permit_status: 'Yes',
      permit_cost: '$35 per session or $350/year',
      permit_details:
        'Permit REQUIRED for ALL posed/formal photography. $35/session or $350/year annual. Contact: info@arboretum.wisc.edu or (608) 262-2445.',
      rules_and_restrictions:
        "Trails close at dusk. If you're shooting sunset, you need to hustle out before they lock the gates. Security WILL find you.",
      seasonal_availability:
        'Best Times: Spring: April-May (wildflowers, fresh green). Fall: Late September-October (fall colors peak). Golden hour: 1 hour before sunset (prairie glows). Avoid: Midday summer (harsh light, buggy).',
      insider_tips:
        'Curtis Prairie (southwest section) = best sunset light. Longenecker Horticultural Gardens = manicured, less "wild" look. Free parking at multiple trailheads. Bug spray in summer is NON-NEGOTIABLE.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Main paths are paved and wheelchair-accessible. Many interior trails are packed earth and may be challenging for mobility devices.',
      parking: 'Free parking at multiple trailheads. Main lot at 1207 Seminole Hwy.',
      drone_policy: 'Prohibited — UW campus property.',
      amenities: 'Restrooms at visitor center. Benches along main paths. No water fountains on trails.',
      permit_personal: 'Required — $35/session or $350/year annual permit.',
      permit_pro: 'Required — $35/session or $350/year annual permit. Contact: info@arboretum.wisc.edu or (608) 262-2445.',
      admission_notes: 'Free admission. Parking is free.',
      booking_info: 'Contact info@arboretum.wisc.edu or (608) 262-2445 for permit.',
      last_verified_at: '2025-07-01',
      nearby_location_slugs: ['vilas-park-zoo-area', 'henry-vilas-beach'],
    },
  },

  // ── 3. Memorial Union Terrace ───────────────────────────────────────
  {
    location: {
      name: 'Memorial Union Terrace',
      slug: 'memorial-union-terrace',
      description:
        'Famous colorful sunburst chairs, Lake Mendota backdrop, sailboats, classic Wisconsin summer feel. Highly Instagrammable.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields — CORRECTED permit_details
      permit_status: 'Prohibited',
      permit_cost: 'N/A',
      permit_details:
        'Submit Photo/Video Approval Request at union.wisc.edu — minimum 4 business day turnaround. NO commercial photography without approval. If caught shooting with a paying client, campus police will ask you to leave. Alternative: Shoot at nearby Picnic Point (no restrictions).',
      rules_and_restrictions:
        "Photographers get burned by this constantly. Every \"best Madison photo spots\" list includes the Terrace, but none mention the commercial policy. Don't be that photographer.",
      seasonal_availability:
        'Best Times (if you CAN shoot here): Late afternoon (4-6pm) for golden light on chairs. Sunset over the lake (west-facing).',
      insider_tips:
        'This is the big one. Verify policy before any shoot, even personal ones.',
      // new fields
      crowd_level: 'High',
      accessibility:
        'Fully wheelchair-accessible. Elevator access inside Memorial Union. Terrace is flat and paved.',
      parking:
        'Very limited. Lot 36 and Lot 46 nearby (metered). Street parking on Langdon St. Free after 4:30 PM in some UW lots.',
      drone_policy: 'Prohibited — UW campus property.',
      amenities: 'Restrooms inside Memorial Union. Food and drinks at Der Rathskeller and terrace vendors. Benches and sunburst chairs.',
      permit_personal: 'Submit Photo/Video Approval Request at union.wisc.edu — minimum 4 business day turnaround.',
      permit_pro: 'Prohibited without UW Special Events permit ($150+, 2-week lead time). Contact: Union South Events (608-890-3000).',
      admission_notes: 'Free to visit. Food/drink available for purchase.',
      booking_info: 'union.wisc.edu Photo/Video Approval Request form.',
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'picnic-point',
        'james-madison-park',
        'lakeshore-nature-preserve-frautschi-point',
      ],
    },
  },

  // ── 4. Olbrich Botanical Gardens ────────────────────────────────────
  {
    location: {
      name: 'Olbrich Botanical Gardens',
      slug: 'olbrich-botanical-gardens',
      description:
        '16 acres of outdoor gardens + indoor Bolz Conservatory (tropical plants, waterfall, koi pond). Lush, romantic, magazine-worthy backdrops.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields — CORRECTED
      permit_status: 'Yes',
      permit_cost: '$125+ for 2-hour session (updated July 2025)',
      permit_details:
        'Permit REQUIRED for all professional photography. Reservations: 2 weeks advance, call (608) 246-4550. Book early for May-September (prime wedding season).',
      rules_and_restrictions:
        'They are STRICT about permits. If you show up with a camera and a couple in a wedding dress, they will stop you and charge you on the spot. Book ahead.',
      seasonal_availability:
        'Best Times: Spring: May (tulips, flowering trees). Summer: June-August (rose garden peak). Fall: September (dahlias, fall foliage). Indoor conservatory: Year-round (climate-controlled).',
      insider_tips:
        'Thai Pavilion = most popular backdrop (book early). Conservatory is $6 admission per adult ($3 ages 6-12). Outdoor gardens close at dusk. Weekend mornings = fewer crowds.',
      // new fields
      crowd_level: 'Moderate to high',
      accessibility:
        'Paved paths throughout outdoor gardens are wheelchair-accessible. Conservatory is fully accessible with automatic doors.',
      parking: 'Free parking lot on-site. Can fill up on weekends and during events.',
      drone_policy: 'Prohibited on garden grounds.',
      amenities: 'Restrooms in main building. Gift shop. Benches throughout gardens. Water fountains near entrance.',
      permit_personal: 'Required — contact (608) 246-4550 for rates.',
      permit_pro: 'Required — $125+ for 2-hour session. Book 2 weeks in advance. Call (608) 246-4550.',
      admission_notes: 'Outdoor gardens: Free. Bolz Conservatory: $6 per adult, $3 ages 6-12.',
      booking_info: 'Call (608) 246-4550 or visit olbrich.org for reservations.',
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'goodman-community-center-atwood-corridor',
        'bb-clarke-beach',
        'yahara-place-park-riverwalk',
      ],
    },
  },

  // ── 5. Picnic Point ─────────────────────────────────────────────────
  {
    location: {
      name: 'Picnic Point',
      slug: 'picnic-point',
      description:
        'Long, narrow peninsula jutting into Lake Mendota. Tree-lined path, Madison skyline views across the water, secluded feel despite being on campus. Classic "Wisconsin nature walk" vibe.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields — CORRECTED insider_tips
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details:
        'No permit needed for portrait sessions. FREE and accessible to public. This is your "Terrace alternative" with no restrictions.',
      rules_and_restrictions:
        "It's a 20-minute walk from parking to the point. Clients in heels? Bring flats for the walk. Also, it's WINDY. Bring hair ties.",
      seasonal_availability:
        'Best Times: Sunset: 1 hour before sunset (golden light on water). Spring/Fall: Best weather, beautiful colors. Avoid: Winter (icy, cold, brutal wind off the lake).',
      insider_tips:
        'Park at Lot 130 (2003 University Bay Drive). Free after 4:30 PM and on weekends. Fire pit at the point (cool prop for engagement shots). Sunset timing: Check weather.gov (lake reflects golden hour beautifully). Bring bug spray in summer.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Main path is flat packed gravel — manageable for most wheelchairs in dry conditions. Gets muddy after rain.',
      parking: 'Park at Lot 130 (2003 University Bay Drive). Free after 4:30 PM and on weekends.',
      drone_policy: 'Prohibited — UW campus property and Lakeshore Nature Preserve.',
      amenities: 'Fire pit at the point. No restrooms on the peninsula (nearest in Lakeshore Residence Halls). Benches along path.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed. Free and accessible to public.',
      admission_notes: 'Free. Open dawn to 10 PM.',
      booking_info: null,
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'memorial-union-terrace',
        'lakeshore-nature-preserve-frautschi-point',
      ],
    },
  },

  // ── 6. Tenney Park ──────────────────────────────────────────────────
  {
    location: {
      name: 'Tenney Park',
      slug: 'tenney-park',
      description:
        'Stone bridges, calm lagoon, willow trees, and open shoreline along Lake Mendota. Easy to move around and find diverse looks in one session.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'No permit required for small portrait sessions. Large/commercial groups may require Parks permit. Contact: Madison Parks (608) 266-4711.',
      rules_and_restrictions:
        'Goose droppings everywhere in summer — choose footwear wisely.',
      seasonal_availability:
        'Best Times: Sunrise = calm water + low traffic. Fall = blazing color + fog over lagoon. Winter = frozen lake + bridge shots.',
      insider_tips:
        'Stone footbridge = best backdrop. Lagoon freezes early → great winter look. Golden hour hits willow tree clusters beautifully.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Paved paths around lagoon are wheelchair-accessible. Stone bridge has steps on one side but a ramp on the other.',
      parking: 'Free parking lot on Marston Ave. Street parking on Sherman Ave. Can be tight on weekends.',
      drone_policy: 'Restricted — FAA authorization required (near Truax Field approach path).',
      amenities: 'Restrooms near shelter. Benches along lagoon. Playground. Beach area in summer.',
      permit_personal: 'No permit needed for small portrait sessions.',
      permit_pro: 'Large/commercial groups may require Parks permit. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'james-madison-park',
        'burrows-park-boathouse',
      ],
    },
  },

  // ── 7. Vilas Park + Zoo Area ────────────────────────────────────────
  {
    location: {
      name: 'Vilas Park + Zoo Area',
      slug: 'vilas-park-zoo-area',
      description:
        'Lake Wingra shoreline, tall trees, quaint footbridge, charming older houses in surrounding streets. Massive seasonal variety.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'No permit needed for small portrait sessions. Zoo exterior areas okay without permit. No photography inside zoo animal exhibits unless pre-approved.',
      rules_and_restrictions: 'Road + parking fills fast on weekends.',
      seasonal_availability:
        'Best Times: Morning → calm water. Fall → peak reds/oranges. Snow → postcard look.',
      insider_tips:
        'The little footbridge by the lagoon = ideal. Tree alley toward Monroe St = killer depth shots. Walk 3-5 blocks for charming white/brick homes.',
      // new fields
      crowd_level: 'Moderate to high',
      accessibility:
        'Paved paths around the park. Zoo is wheelchair-accessible. Some grassy areas may be uneven.',
      parking: 'Free parking lot off Vilas Park Drive. Street parking on Drake St and Edgewood Ave. Fills fast on weekends.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'Restrooms in park and zoo. Playgrounds. Picnic shelters. Beach area.',
      permit_personal: 'No permit needed for small portrait sessions.',
      permit_pro: 'Zoo exterior OK without permit. Interior animal exhibits require pre-approval.',
      admission_notes: 'Park: Free. Henry Vilas Zoo: Free admission (donations welcome).',
      booking_info: null,
      last_verified_at: '2025-07-01',
      nearby_location_slugs: ['henry-vilas-beach', 'uw-madison-arboretum'],
    },
  },

  // ── 8. Olin Park / Olin Turville ────────────────────────────────────
  {
    location: {
      name: 'Olin Park / Olin Turville',
      slug: 'olin-park-olin-turville',
      description:
        'Best unobstructed Madison skyline view from land. Fields, paths, tall grasses, and oak groves.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'Small portrait sessions allowed. Large paid groups may require permit. Contact: Madison Parks (608) 266-4711.',
      rules_and_restrictions: 'Windy — hair control becomes a thing.',
      seasonal_availability:
        'Best Times: Sunset: Skyline glows → primary reason to come here.',
      insider_tips:
        'Shoreline grass gives nice depth. Great for silhouettes at sunset. Bring a longer lens to compress skyline.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Paved paths to main viewpoints. Some grassy hill areas are not accessible for wheelchairs.',
      parking: 'Free parking lot off John Nolen Dr. Additional lot at Turville Point.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'Restrooms at main shelter. Benches along shoreline. Picnic tables.',
      permit_personal: 'No permit needed for small portrait sessions.',
      permit_pro: 'Large paid groups may require Parks permit. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'monona-bay-boardwalk',
        'alliant-energy-center-grounds',
        'alliant-energy-center-willow-island',
      ],
    },
  },

  // ── 9. Bassett & Washington Warehouse District ──────────────────────
  {
    location: {
      name: 'Bassett & Washington Warehouse District',
      slug: 'bassett-washington-warehouse-district',
      description:
        'Industrial brick, alley textures, loading docks, gritty urban tones rarely seen on Madison lists. Perfect for fashion + branding sessions.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for public areas',
      permit_details:
        'No permit for sidewalks/alleys. Private loading docks = ask permission.',
      rules_and_restrictions: 'Delivery traffic. Stay alert.',
      seasonal_availability:
        'Best Times: Late afternoon → soft reflective light. Cloudy days help soften harsh alley shadows.',
      insider_tips:
        'Great for film-style portraiture. Look for painted brick + rusted metal textures. Night shots with street lights = moody.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Sidewalks are accessible. Alleys and loading docks may have uneven surfaces.',
      parking: 'Metered street parking. Nearby public ramps on Dayton St.',
      drone_policy: 'Check local regulations — urban area with mixed-use buildings.',
      amenities: 'No public amenities. Nearby restaurants and cafes for breaks.',
      permit_personal: 'No permit needed on public sidewalks and alleys.',
      permit_pro: 'No permit for public areas. Private loading docks require property owner permission.',
      admission_notes: null,
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'capitol-square-state-street-loop',
        'wisconsin-state-capitol',
      ],
    },
  },

  // ── 10. Madison Central Library ─────────────────────────────────────
  {
    location: {
      name: 'Madison Central Library',
      slug: 'madison-central-library',
      description:
        'Clean, modern interiors. Big windows for contemporary natural-light portraits. Interesting staircases + metal/wood details.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Yes',
      permit_cost: 'Free with permission',
      permit_details:
        'MUST request permission for professional/paid shoots. Staff typically allows small, quiet sessions. Contact: (608) 266-6300.',
      rules_and_restrictions:
        'Need to stay out of high-traffic reading areas.',
      seasonal_availability:
        'Best Times: Weekday mornings — fewer people.',
      insider_tips:
        'Third floor stacks → warm tones + symmetry. Glass stair rails = sleek portrait backdrops. Winter-friendly option.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Fully wheelchair-accessible. Elevator to all floors. Automatic doors at entrance.',
      parking: 'Metered street parking. Capitol Square ramps nearby. Limited free parking on weekends.',
      drone_policy: 'Prohibited — indoor facility and downtown restricted area.',
      amenities: 'Restrooms on every floor. Water fountains. Free Wi-Fi. Study areas.',
      permit_personal: 'Small, quiet personal sessions typically allowed. Ask staff.',
      permit_pro: 'Required — request permission. Contact: (608) 266-6300.',
      admission_notes: 'Free. Public library hours.',
      booking_info: 'Contact (608) 266-6300 to request professional photography permission.',
      last_verified_at: null,
      nearby_location_slugs: [
        'wisconsin-state-capitol',
        'capitol-square-state-street-loop',
      ],
    },
  },

  // ── 11. Alliant Energy Center Grounds ───────────────────────────────
  {
    location: {
      name: 'Alliant Energy Center Grounds',
      slug: 'alliant-energy-center-grounds',
      description:
        'Wide concrete spaces, long leading lines, metal structures, grassy buffers — a flexible hybrid of industrial + minimalistic outdoor looks.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free with permission',
      permit_details:
        'Outdoor casual/small portrait sessions usually OK. Professional shoots may require permission — case-by-case. Contact: (608) 267-3976.',
      rules_and_restrictions:
        'During big events (concerts/fairs), access is limited or fenced.',
      seasonal_availability:
        'Best Times: Sunset — warm tones over open pavement. Cloudy = ideal soft industrial look.',
      insider_tips:
        'The south end has clean concrete + metal backdrop. Great for full-body branding shots. Minimal foot traffic → stress-free shooting.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Paved and flat throughout. Fully wheelchair-accessible.',
      parking: 'Large free parking lots surrounding the venue.',
      drone_policy: 'Restricted — FAA authorization required. Check event restrictions.',
      amenities: 'Restrooms inside venue during events. Limited outdoor amenities.',
      permit_personal: 'Usually OK for casual/small portrait sessions.',
      permit_pro: 'May require permission — case-by-case. Contact: (608) 267-3976.',
      admission_notes: 'Grounds are free to access when not hosting events.',
      booking_info: 'Contact (608) 267-3976 for professional session requests.',
      last_verified_at: null,
      nearby_location_slugs: [
        'alliant-energy-center-willow-island',
        'olin-park-olin-turville',
        'monona-bay-boardwalk',
      ],
    },
  },

  // ── 12. James Madison Park ──────────────────────────────────────────
  {
    location: {
      name: 'James Madison Park',
      slug: 'james-madison-park',
      // CORRECTED description
      description:
        'Gorgeous Lake Mendota shoreline + open lawn + historic Gates of Heaven building (historic sandstone synagogue, 1863) for classic, architectural contrast.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'Small shoots OK. Permit required for use of Gates of Heaven building interior. Contact: Madison Parks (608) 266-4711.',
      rules_and_restrictions:
        'Wind and lake spray — hair management needed.',
      seasonal_availability:
        'Best Times: Sunrise → calm water + empty park. Afternoon → harsher but doable with reflectors.',
      insider_tips:
        'Use the stone synagogue for vintage look. Long lens → compress lake beautifully. Great winter ice shots (when safe).',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Paved paths through the park. Lawn areas may be uneven. Gates of Heaven has step access only.',
      parking: 'Street parking on Gorham St and Butler St. Metered. Can be competitive near campus.',
      drone_policy: 'Restricted — FAA authorization required. Near UW campus flight restrictions.',
      amenities: 'Restrooms at park shelter. Benches. Open lawn area. Beach area in summer.',
      permit_personal: 'No permit needed for small portrait sessions.',
      permit_pro: 'Permit required for Gates of Heaven interior. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: '2025-07-01',
      nearby_location_slugs: [
        'wisconsin-state-capitol',
        'tenney-park',
        'memorial-union-terrace',
      ],
    },
  },

  // ── 13. Monona Terrace Rooftop ──────────────────────────────────────
  {
    location: {
      name: 'Monona Terrace Rooftop',
      slug: 'monona-terrace-rooftop',
      description:
        'Modern architecture + sweeping views of Lake Monona + curved lines + glass. Very clean, bright aesthetic.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free with permission',
      permit_details:
        'Professional photography may require approval. Events have priority → avoid wedding/event blocks. Contact: (608) 261-4093.',
      rules_and_restrictions:
        'Rooftop can be closed for private events — always check first.',
      seasonal_availability:
        'Best Times: Sunset → gold on water + skyline. Blue hour → city glow.',
      insider_tips:
        'Lakefront terrace walkway below also excellent. Curved walls create great negative space. Strong wind — minimal props.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Fully wheelchair-accessible. Elevator to rooftop. Smooth surfaces throughout.',
      parking: 'Monona Terrace parking garage ($5+). Street parking on Wilson St.',
      drone_policy: 'Prohibited — government building and controlled airspace near Capitol.',
      amenities: 'Restrooms inside. Cafe on lower level. Benches on rooftop garden.',
      permit_personal: 'Small personal sessions generally OK. Check for event closures.',
      permit_pro: 'Professional photography may require approval. Contact: (608) 261-4093.',
      admission_notes: 'Free rooftop access during public hours.',
      booking_info: 'Contact (608) 261-4093 for professional photography approval.',
      last_verified_at: null,
      nearby_location_slugs: [
        'wisconsin-state-capitol',
        'law-park-lake-monona-shoreline',
        'capitol-square-state-street-loop',
      ],
    },
  },

  // ── 14. Law Park (Lake Monona Shoreline) ────────────────────────────
  {
    location: {
      name: 'Law Park (Lake Monona Shoreline)',
      slug: 'law-park-lake-monona-shoreline',
      description:
        'Lake Monona boardwalk, skyline behind, grassy patches + bikeway minimalism. Clean + classic.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Small portrait sessions allowed.',
      rules_and_restrictions:
        'Busy bike path — timing is key. Traffic noise but manageable.',
      seasonal_availability:
        'Best Times: Evening → skyline glows. Sunrise → soft, dreamy water.',
      insider_tips:
        'Bring longer focal length to compress skyline. Use retaining wall along path for clean lines. Great backup when Monona Terrace is booked.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Paved bikeway is fully wheelchair-accessible. Flat terrain throughout.',
      parking: 'Limited street parking on Blair St. Monona Terrace garage nearby.',
      drone_policy: 'Restricted — FAA authorization required. Near Capitol restricted zone.',
      amenities: 'Benches along path. No restrooms (Monona Terrace nearby).',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for small portrait sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'monona-terrace-rooftop',
        'wisconsin-state-capitol',
      ],
    },
  },

  // ── 15. Garver Feed Mill ────────────────────────────────────────────
  {
    location: {
      name: 'Garver Feed Mill',
      slug: 'garver-feed-mill',
      description:
        "Restored historic feed mill → exposed brick, black steel, glass, artisan spaces. One of Madison's hottest wedding + photo backdrops.",
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for public areas',
      permit_details:
        "Indoor professional photography requires permission. Some outdoor areas public; others private tenant space. Contact: info@garverfeedmill.com.",
      rules_and_restrictions:
        "Indoor areas are tenant-controlled — don't assume access.",
      seasonal_availability:
        'Best Times: Late afternoon → soft brick glow. Cloudy → perfect industrial mood.',
      insider_tips:
        'East side path behind building → dreamy evening light. Great winter option for indoor/outdoor hybrid. Parking fills fast on weekends.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Main building entrance is wheelchair-accessible. Outdoor paths are paved. Some gravel areas around the perimeter.',
      parking: 'Free parking lot on-site. Fills quickly on weekends and during events.',
      drone_policy: 'Check local regulations — mixed-use property near residential area.',
      amenities: 'Restrooms inside. Artisan food vendors. Indoor seating areas.',
      permit_personal: 'Outdoor public areas OK. Indoor requires permission.',
      permit_pro: 'Required for indoor professional photography. Contact: info@garverfeedmill.com.',
      admission_notes: 'Free to visit public areas.',
      booking_info: 'Contact info@garverfeedmill.com for indoor photography permission.',
      last_verified_at: null,
      nearby_location_slugs: [
        'olbrich-botanical-gardens',
        'goodman-community-center-atwood-corridor',
      ],
    },
  },

  // ── 16. Henry Vilas Beach (Lake Wingra Shore) ───────────────────────
  {
    location: {
      name: 'Henry Vilas Beach (Lake Wingra Shore)',
      slug: 'henry-vilas-beach',
      description:
        "Quiet, natural lakeshore tucked behind Vilas Park. Soft sand, willow trees, and clear sunset views. One of Madison's most underrated lakeside gems.",
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'No permit needed for portrait sessions. Avoid large paid groups (consider Parks permit if >6 people). Contact: Madison Parks (608) 266-4711.',
      rules_and_restrictions:
        'Mosquitoes at dusk — bring repellant.',
      seasonal_availability:
        'Best Times: Sunset for reflections on Lake Wingra. Early morning for glass-still water.',
      insider_tips:
        'Use the shoreline trees for natural framing. Hidden benches for intimate poses. Combine with nearby Vilas Park for variety.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Beach area has soft sand — not wheelchair-accessible. Paved path approaches from Vilas Park.',
      parking: 'Free parking at Vilas Park lot off Vilas Park Drive. Street parking on Drake St.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'Restrooms at beach house (seasonal). Benches. Lifeguard in summer.',
      permit_personal: 'No permit needed for portrait sessions.',
      permit_pro: 'Consider Parks permit for groups >6 people. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: ['vilas-park-zoo-area', 'uw-madison-arboretum'],
    },
  },

  // ── 17. Capitol Square / State Street Loop ──────────────────────────
  {
    location: {
      name: 'Capitol Square / State Street Loop',
      slug: 'capitol-square-state-street-loop',
      description:
        'Urban energy — brick facades, neon lights, storefront reflections, Capitol dome framing State Street. Perfect for downtown lifestyle shoots.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for public areas',
      permit_details:
        'Public sidewalks OK. Avoid private shopfront interiors without permission.',
      rules_and_restrictions:
        'Heavy pedestrian traffic — plan off-hours (Sunday morning ideal).',
      seasonal_availability:
        'Best Times: Golden hour → warm storefront reflections. Night → bokeh lights, cinematic look.',
      insider_tips:
        'Use telephoto lens to compress dome view. Mifflin and King streets = quieter cross streets. Great winter night shots with holiday lights.',
      // new fields
      crowd_level: 'High',
      accessibility:
        'Sidewalks are fully wheelchair-accessible. State Street is pedestrian-only (buses excepted).',
      parking: 'Capitol Square ramps. Metered street parking. Free on weekends in some areas.',
      drone_policy: 'Prohibited — Capitol restricted airspace and dense pedestrian area.',
      amenities: 'Restaurants, cafes, and shops throughout. Public restrooms in Capitol building.',
      permit_personal: 'No permit needed on public sidewalks.',
      permit_pro: 'No permit for public sidewalks. Private shopfront interiors require permission.',
      admission_notes: null,
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'wisconsin-state-capitol',
        'monona-terrace-rooftop',
        'bassett-washington-warehouse-district',
      ],
    },
  },

  // ── 18. Warner Park ─────────────────────────────────────────────────
  {
    location: {
      name: 'Warner Park',
      slug: 'warner-park',
      description:
        'Open fields, pines, shoreline trails, and the lagoon. Spacious, calm, ideal for golden-hour family shoots.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'Portrait sessions OK. Large paid groups → Parks permit. Contact: Madison Parks (608) 266-4711.',
      rules_and_restrictions:
        'Baseball games = full parking lots; plan around events.',
      seasonal_availability:
        'Best Times: Evening golden hour over the lagoon. Autumn foliage = vivid orange tones.',
      insider_tips:
        'Lagoon footbridge for symmetry shots. Pine grove near north end = dreamy backlight. Ample open space for long-lens depth.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Paved paths around lagoon. Open fields are grass — generally flat. Playground area accessible.',
      parking: 'Free parking lot at Warner Park. Additional lot near baseball stadium.',
      drone_policy: 'Restricted — FAA authorization required. Check for event TFRs.',
      amenities: 'Restrooms at park shelter. Playground. Picnic shelters. Baseball field.',
      permit_personal: 'No permit needed for portrait sessions.',
      permit_pro: 'Large paid groups require Parks permit. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: ['tenney-park', 'burrows-park-boathouse'],
    },
  },

  // ── 19. B.B. Clarke Beach ───────────────────────────────────────────
  {
    location: {
      name: 'B.B. Clarke Beach',
      slug: 'bb-clarke-beach',
      description:
        'Tucked-away neighborhood beach with wooden pier, willow canopy, and intimate feel. Looks like a Northwoods hideaway five minutes from downtown.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Small sessions OK.',
      rules_and_restrictions:
        'No tripods blocking walkway. Limited parking; come early.',
      seasonal_availability:
        'Best Times: Sunset for soft lake glow. Early morning → mist over Monona.',
      insider_tips:
        'Short pier perfect for symmetry compositions. Nearby Yahara Place Park = bonus greenery. Great quiet alternative to Law Park.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Beach area is sand and grass — not wheelchair-accessible. Street-level approach is flat.',
      parking: 'Limited street parking on Spaight St and Rutledge St.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'No restrooms. Benches. Wooden pier.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for small sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'yahara-place-park-riverwalk',
        'olbrich-botanical-gardens',
        'goodman-community-center-atwood-corridor',
      ],
    },
  },

  // ── 20. Goodman Community Center / Atwood Corridor ──────────────────
  {
    location: {
      name: 'Goodman Community Center / Atwood Corridor',
      slug: 'goodman-community-center-atwood-corridor',
      description:
        'Converted industrial buildings with ivy-covered brick, murals, bike path, and cafe-style charm. East-side vibe meets clean textures.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for public areas',
      permit_details:
        'Outdoor public access fine. Indoor shoots require permission. Contact: (608) 241-1574.',
      rules_and_restrictions:
        'Busy weekends — lots of bikers/pedestrians.',
      seasonal_availability:
        'Best Times: Late afternoon light on brick walls. Morning → cool industrial tones.',
      insider_tips:
        'Murals behind main building = excellent backdrops. Great coffee stops for lifestyle props. Walk the nearby Capital City Trail for extended looks.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Sidewalks and bike path are wheelchair-accessible. Community center is ADA-compliant.',
      parking: 'Street parking on Atwood Ave. Free lot at community center.',
      drone_policy: 'Check local regulations — residential and commercial mixed-use area.',
      amenities: 'Restrooms inside community center (during hours). Cafes and restaurants along Atwood Ave.',
      permit_personal: 'No permit needed for outdoor public areas.',
      permit_pro: 'Indoor shoots require permission. Contact: (608) 241-1574.',
      admission_notes: null,
      booking_info: 'Contact (608) 241-1574 for indoor photography permission.',
      last_verified_at: null,
      nearby_location_slugs: [
        'olbrich-botanical-gardens',
        'bb-clarke-beach',
        'yahara-place-park-riverwalk',
      ],
    },
  },

  // ── 21. Yahara Place Park (Riverwalk) ───────────────────────────────
  {
    location: {
      name: 'Yahara Place Park (Riverwalk)',
      slug: 'yahara-place-park-riverwalk',
      description:
        'A tranquil riverwalk lining the Yahara River with willow trees, short docks, and intimate grassy banks. Very serene — perfect for timeless, natural portraits.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Small portrait sessions OK.',
      rules_and_restrictions:
        'No blocking docks / paths. Very limited shooting angles — small space.',
      seasonal_availability:
        'Best Times: Early morning → still water + fog. Sunset → warm reflection across river.',
      insider_tips:
        'Short piers = leading-line compositions. Willows create beautiful soft backdrops. Combine with nearby BB Clarke Beach for variety.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Paved path along riverwalk is wheelchair-accessible. Docks may have steps or uneven surfaces.',
      parking: 'Street parking on Spaight St and Williamson St. Limited.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'Benches. Short docks. No restrooms on site.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for small portrait sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'bb-clarke-beach',
        'olbrich-botanical-gardens',
      ],
    },
  },

  // ── 22. Burrows Park Boathouse ──────────────────────────────────────
  {
    location: {
      name: 'Burrows Park Boathouse',
      slug: 'burrows-park-boathouse',
      description:
        'Historic stone boathouse jutting into Lake Mendota. Natural + architectural hybrid. Perfect for dramatic lake-edge images.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Small portrait sessions OK.',
      rules_and_restrictions:
        'Boathouse interior generally not accessible. Wind off Mendota can be intense — bring hair plan.',
      seasonal_availability:
        'Best Times: Sunrise — lake fog = magic. Blue hour — reflection + structure silhouette.',
      insider_tips:
        'Shoot from side angle to feature stone textures. Trees behind building soften harsh frames. Winter → frozen lake = unique platform.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Path to boathouse is packed gravel — manageable for wheelchairs in dry conditions. Boathouse area has uneven stone surfaces.',
      parking: 'Small free lot off N Sherman Ave. Street parking available.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'No restrooms. Benches near shoreline.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for small portrait sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'tenney-park',
        'warner-park',
      ],
    },
  },

  // ── 23. Alliant Energy Center – Willow Island ───────────────────────
  {
    location: {
      name: 'Alliant Energy Center – Willow Island',
      slug: 'alliant-energy-center-willow-island',
      description:
        'A quiet, scenic peninsula on Lake Monona — tall grasses, open water, peaceful walking paths. Nature feel without leaving town.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for casual sessions',
      permit_details:
        'Casual portrait sessions generally OK. Events take priority — check ahead.',
      rules_and_restrictions: 'Can be fenced off during events.',
      seasonal_availability:
        'Best Times: Sunset → warm glow + water reflection. Morning → mist.',
      insider_tips:
        'Tall grasses → dreamy backlit shots. Long lens to compress city shoreline. Bring blanket — wide nature looks.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Walking paths are packed gravel — mostly flat. Not all areas are wheelchair-accessible.',
      parking: 'Free parking at Alliant Energy Center lots when no events.',
      drone_policy: 'Restricted — FAA authorization required. Check event restrictions.',
      amenities: 'No restrooms on peninsula. Alliant Energy Center facilities nearby during events.',
      permit_personal: 'No permit needed for casual portrait sessions.',
      permit_pro: 'Events take priority. Check ahead with Alliant Energy Center.',
      admission_notes: 'Free when not hosting events.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'alliant-energy-center-grounds',
        'olin-park-olin-turville',
      ],
    },
  },

  // ── 24. Hilldale Shopping Center ────────────────────────────────────
  {
    location: {
      name: 'Hilldale Shopping Center – Exterior + Parking Terrace',
      slug: 'hilldale-shopping-center',
      description:
        'Modern open-air shopping center with upscale storefronts, string lights, clean lines, and parking-deck skyline peeks. Great for commercial branding & lifestyle shoots.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free with permission',
      permit_details:
        'Technically private property. Small, low-impact sessions often tolerated. For formal paid sessions → request permission. Contact: Hilldale management (608) 238-6353.',
      rules_and_restrictions: 'Weekends busy → go early.',
      seasonal_availability:
        'Best Times: Golden hour → beautiful building bounce. Night → string lights + signage glow.',
      insider_tips:
        'Sidewalk seating areas = relaxed lifestyle energy. Parking deck → skyline + negative space. Use storefront reflections for creative shots.',
      // new fields
      crowd_level: 'Moderate to high',
      accessibility:
        'Fully wheelchair-accessible. Elevator access in parking structure. Flat sidewalks throughout.',
      parking: 'Free parking garage and surface lots. Ample availability on weekday mornings.',
      drone_policy: 'Prohibited — private property and commercial area.',
      amenities: 'Restrooms inside retail stores. Restaurants and cafes. Outdoor seating areas.',
      permit_personal: 'Small, low-impact sessions often tolerated.',
      permit_pro: 'Request permission for formal paid sessions. Contact: Hilldale management (608) 238-6353.',
      admission_notes: null,
      booking_info: 'Contact Hilldale management (608) 238-6353 for photography permits.',
      last_verified_at: null,
      nearby_location_slugs: ['hoyt-park'],
    },
  },

  // ── 25. Hoyt Park ──────────────────────────────────────────────────
  {
    location: {
      name: 'Hoyt Park',
      slug: 'hoyt-park',
      description:
        'Rustic stone shelter, winding wooded trails, tall pines, mossy stone steps — feels like a Northwoods getaway inside the city.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'Small portrait sessions allowed. Shelter rentals require permit.',
      rules_and_restrictions:
        'Low light in deep woods — fast lens recommended.',
      seasonal_availability:
        'Best Times: Late afternoon → warm forest glow. Fall → golden canopy.',
      insider_tips:
        'Stone shelter = dramatic backdrop. Pine stands provide tall, moody texture. Great foggy-morning location.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Main shelter area accessible by car. Trails are steep and unpaved — not wheelchair-accessible. Stone steps throughout.',
      parking: 'Small free lot at park entrance off Regent St / Owen Pkwy.',
      drone_policy: 'Restricted — FAA authorization required. Heavy tree canopy limits usefulness.',
      amenities: 'Stone shelter (reservable). No restrooms. Benches near shelter.',
      permit_personal: 'No permit needed for small portrait sessions.',
      permit_pro: 'Shelter rentals require permit. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: ['hilldale-shopping-center'],
    },
  },

  // ── 26. Lakeshore Nature Preserve – Frautschi Point ─────────────────
  {
    location: {
      name: 'Lakeshore Nature Preserve – Frautschi Point',
      slug: 'lakeshore-nature-preserve-frautschi-point',
      description:
        'Secluded woodland point overlooking Lake Mendota, with natural trails, evergreens, and unobstructed water views. Quiet + romantic.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details:
        'Casual portrait sessions OK. Large commercial setups discouraged.',
      rules_and_restrictions:
        'Parking limited; trails can be muddy after rain.',
      seasonal_availability:
        'Best Times: Sunset → glow over water. Dawn → quiet + mist.',
      insider_tips:
        'Benches with lake views = intimate feels. Fallen trees make great posing elements. Pair with Picnic Point for variety.',
      // new fields
      crowd_level: 'Low',
      accessibility:
        'Natural dirt trails — not wheelchair-accessible. Steep sections and tree roots throughout.',
      parking: 'Very limited. Nearest parking at Lot 130 (University Bay Drive) or Eagle Heights area.',
      drone_policy: 'Prohibited — UW campus property and Lakeshore Nature Preserve.',
      amenities: 'Benches at point overlook. No restrooms. No water fountains.',
      permit_personal: 'No permit needed for casual portrait sessions.',
      permit_pro: 'Large commercial setups discouraged. Contact UW Lakeshore Nature Preserve for guidance.',
      admission_notes: 'Free. Open dawn to 10 PM.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'picnic-point',
        'memorial-union-terrace',
      ],
    },
  },

  // ── 27. Elver Park ─────────────────────────────────────────────────
  {
    location: {
      name: 'Elver Park',
      slug: 'elver-park',
      description:
        "Madison's largest community park: rolling hills, tall grasses, woodland edges, bridges, and surprisingly varied terrain.",
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'Varies',
      permit_cost: 'Free for small sessions',
      permit_details:
        'Small shoots OK. Large commercial groups → Parks permit.',
      rules_and_restrictions:
        'Big sledding hill = crowded on snow days.',
      seasonal_availability:
        'Best Times: Golden hour → tall grass glows beautifully. Early fall → peak color.',
      insider_tips:
        'Grassy hills → wide scenic shots. Wooded edges = soft filtered light. Great space for kids to roam naturally.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Paved paths around main areas. Hills are grass — not wheelchair-accessible. Playground area is accessible.',
      parking: 'Free parking lot off McKenna Blvd. Multiple access points.',
      drone_policy: 'Restricted — FAA authorization required.',
      amenities: 'Restrooms at park shelter. Playground. Splash pad (seasonal). Picnic shelters. Sledding hill.',
      permit_personal: 'No permit needed for small shoots.',
      permit_pro: 'Large commercial groups require Parks permit. Contact: Madison Parks (608) 266-4711.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: ['hoyt-park', 'hilldale-shopping-center'],
    },
  },

  // ── 28. Monona Bay Boardwalk (Brittingham Park) ─────────────────────
  {
    location: {
      name: 'Monona Bay Boardwalk (Brittingham Park)',
      slug: 'monona-bay-boardwalk',
      description:
        'Wooden boardwalk along Monona Bay with skyline reflections, sailboats, open water, and grassy park space.',
      city: 'Madison',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Small portrait sessions allowed.',
      rules_and_restrictions:
        'No tripods blocking walkway. Lots of joggers + bikers → off-peak best.',
      seasonal_availability:
        'Best Times: Sunset → stunning water reflections. Blue hour → skyline lights.',
      insider_tips:
        'Use the curve in the boardwalk for strong leading lines. Minimalist water compositions → elegant portraits. Bring longer lens to compress skyline.',
      // new fields
      crowd_level: 'Moderate',
      accessibility:
        'Boardwalk is wheelchair-accessible and flat. Park areas are grass — mostly even.',
      parking: 'Free parking at Brittingham Park lot off W Washington Ave.',
      drone_policy: 'Restricted — FAA authorization required. Near Capitol restricted zone.',
      amenities: 'Restrooms at Brittingham Park shelter. Benches along boardwalk. Playground.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for small portrait sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: [
        'olin-park-olin-turville',
        'alliant-energy-center-grounds',
      ],
    },
  },

  // ── 29. Pope Farm Conservancy ───────────────────────────────────────
  {
    location: {
      name: 'Pope Farm Conservancy',
      slug: 'pope-farm-conservancy',
      // CORRECTED description — no sunflower reference
      description:
        '105 acres of rolling hills, native prairie restorations, and panoramic views of the Middleton countryside. Wide-open pastoral beauty with stunning fall colors.',
      city: 'Middleton',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields — CORRECTED
      permit_status: 'Varies',
      permit_cost: 'Ticketed during events',
      permit_details:
        'info@popefarmconservancy.org or (608) 833-5887',
      rules_and_restrictions:
        'Stay on marked trails. No picking wildflowers. Dogs must be leashed. Park closes at dusk.',
      seasonal_availability:
        'Best Times: Spring: Prairie wildflowers emerge. Golden hour: Prairie grasses glow beautifully. Fall: Stunning autumn colors on rolling hills. Winter: Snow-covered hills for minimalist compositions.',
      insider_tips:
        'Arrive early during peak season (crowds + parking). Rolling hills create natural depth. Bring wide-angle lens for field shots.',
      // new fields
      crowd_level: 'Varies by season',
      accessibility:
        'Main paths are mowed grass — manageable in dry conditions. Rolling hills are not wheelchair-accessible. No paved trails.',
      parking: 'Free parking lot off Old Sauk Rd. Can fill quickly during peak season.',
      drone_policy: 'Check local regulations — open conservancy land.',
      amenities: 'Portable restrooms (seasonal). Benches at hilltop overlook. No water fountains.',
      permit_personal: 'Small portrait sessions generally OK.',
      permit_pro: 'Contact: info@popefarmconservancy.org or (608) 833-5887.',
      admission_notes: 'May require ticketed entry during special events.',
      booking_info: 'Contact info@popefarmconservancy.org or (608) 833-5887.',
      last_verified_at: '2025-07-01',
      nearby_location_slugs: ['pheasant-branch-conservancy'],
    },
  },

  // ── 30. Pheasant Branch Conservancy ─────────────────────────────────
  {
    location: {
      name: 'Pheasant Branch Conservancy',
      slug: 'pheasant-branch-conservancy',
      description:
        '160 acres with rivers, boardwalks, hiking trails, fields, and forests. A true nature escape just outside Madison.',
      city: 'Middleton',
      state: 'WI',
      country: 'USA',
    },
    intelligence: {
      // legacy fields
      permit_status: 'No',
      permit_cost: 'Free',
      permit_details: 'Portrait sessions allowed.',
      rules_and_restrictions:
        'Respect wildlife areas. Trails can be muddy — appropriate footwear essential.',
      seasonal_availability:
        'Best Times: Spring: Wildflowers, flowing creeks. Fall: Vibrant foliage. Golden hour: Fields and boardwalks glow.',
      insider_tips:
        'Boardwalk sections = unique elevated angles. Creek areas perfect for adventurous couples. Less crowded than Arboretum.',
      // new fields
      crowd_level: 'Low to moderate',
      accessibility:
        'Boardwalk sections are wheelchair-accessible. Natural trails are packed earth and can be muddy — not reliably accessible.',
      parking: 'Free parking lot off Pheasant Branch Rd. Additional trailhead parking off Century Ave.',
      drone_policy: 'Check local regulations — conservancy land near residential areas.',
      amenities: 'No restrooms on trails. Benches along boardwalk. Interpretive signage.',
      permit_personal: 'No permit needed.',
      permit_pro: 'No permit needed for portrait sessions.',
      admission_notes: 'Free.',
      booking_info: null,
      last_verified_at: null,
      nearby_location_slugs: ['pope-farm-conservancy'],
    },
  },
];

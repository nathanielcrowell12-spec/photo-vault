// C:\Users\natha\.cursor\Photo Vault\photovault-hub\scripts\seed-madison-locations.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const locationsData = [
    // --- Location Data Starts Here ---
    {
        location: { name: 'Wisconsin State Capitol', slug: 'wisconsin-state-capitol', description: 'Grand white granite exterior, magnificent staircases, commanding dome. Inside: marble rotunda, mosaic floors, sweeping staircases. The Capitol offers timeless, elegant backdrops that photograph well year-round.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'No permit needed for small portrait sessions (1-3 people). Permit required for weddings or large groups. Contact: Wisconsin State Capitol Police (608-266-7541).', rules_and_restrictions: 'Security is strict. Don\'t bring large equipment bags, tripods, or reflectors without clearing it first. They WILL stop you.', seasonal_availability: 'Best Times: Exterior: Late afternoon (4-6pm) for warm light on west-facing granite steps. Interior: Weekdays 8am-10am (before tourist crowds). Avoid: Weekends during legislative session (Jan-May) - very crowded.', insider_tips: 'The north-facing steps get beautiful diffused light all day. Martin Luther King Jr. Blvd side has less foot traffic than State Street side. Free 2-hour street parking on weekends.' }
    },
    {
        location: { name: 'UW-Madison Arboretum', slug: 'uw-madison-arboretum', description: '1,200 acres of diverse landscapes. Winding trails through tall trees, prairie meadows, Curtis Prairie in golden hour, secluded forest clearings. Romantic without trying too hard.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'No permit needed for personal/small portrait sessions. Permit required for commercial shoots or weddings. Email: arboretum@wisc.edu or call (608) 263-7888.', rules_and_restrictions: 'Trails close at dusk. If you\'re shooting sunset, you need to hustle out before they lock the gates. Security WILL find you.', seasonal_availability: 'Best Times: Spring: April-May (wildflowers, fresh green). Fall: Late September-October (fall colors peak). Golden hour: 1 hour before sunset (prairie glows). Avoid: Midday summer (harsh light, buggy).', insider_tips: 'Curtis Prairie (southwest section) = best sunset light. Longenecker Horticultural Gardens = manicured, less "wild" look. Free parking at multiple trailheads. Bug spray in summer is NON-NEGOTIABLE.' }
    },
    {
        location: { name: 'Memorial Union Terrace', slug: 'memorial-union-terrace', description: 'Famous colorful sunburst chairs, Lake Mendota backdrop, sailboats, classic Wisconsin summer feel. Highly Instagrammable.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Prohibited', permit_cost: 'N/A', permit_details: 'NO COMMERCIAL PHOTOGRAPHY ALLOWED. UW-Madison has a strict policy. If you\'re shooting with a paying client, campus police will ask you to leave. Workaround: Shoot at nearby Picnic Point instead (no restrictions) or get a UW Special Events permit ($150+, 2-week lead time). Contact: Union South Events (608-890-3000).', rules_and_restrictions: 'Photographers get burned by this constantly. Every "best Madison photo spots" list includes the Terrace, but none mention the commercial policy. Don\'t be that photographer.', seasonal_availability: 'Best Times (if you CAN shoot here): Late afternoon (4-6pm) for golden light on chairs. Sunset over the lake (west-facing).', insider_tips: 'This is the big one. Verify policy before any shoot, even personal ones.' }
    },
    {
        location: { name: 'Olbrich Botanical Gardens', slug: 'olbrich-botanical-gardens', description: '16 acres of outdoor gardens + indoor Bolz Conservatory (tropical plants, waterfall, koi pond). Lush, romantic, magazine-worthy backdrops.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Yes', permit_cost: '$100 for 2-hour session', permit_details: 'Permit REQUIRED for all professional photography. Reservations: 2 weeks advance, call (608) 246-4550. Book early for May-September (prime wedding season).', rules_and_restrictions: 'They are STRICT about permits. If you show up with a camera and a couple in a wedding dress, they will stop you and charge you on the spot. Book ahead.', seasonal_availability: 'Best Times: Spring: May (tulips, flowering trees). Summer: June-August (rose garden peak). Fall: September (dahlias, fall foliage). Indoor conservatory: Year-round (climate-controlled).', insider_tips: 'Thai Pavilion = most popular backdrop (book early). Conservatory is $2 admission per person (include in your pricing). Outdoor gardens close at dusk. Weekend mornings = fewer crowds.' }
    },
    {
        location: { name: 'Picnic Point', slug: 'picnic-point', description: 'Long, narrow peninsula jutting into Lake Mendota. Tree-lined path, Madison skyline views across the water, secluded feel despite being on campus. Classic "Wisconsin nature walk" vibe.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'No permit needed for portrait sessions. FREE and accessible to public. This is your "Terrace alternative" with no restrictions.', rules_and_restrictions: 'It\'s a 20-minute walk from parking to the point. Clients in heels? Bring flats for the walk. Also, it\'s WINDY. Bring hair ties.', seasonal_availability: 'Best Times: Sunset: 1 hour before sunset (golden light on water). Spring/Fall: Best weather, beautiful colors. Avoid: Winter (icy, cold, brutal wind off the lake).', insider_tips: 'Park at Lot 60 (end of Lakeshore Path). Fire pit at the point (cool prop for engagement shots). Sunset timing: Check weather.gov (lake reflects golden hour beautifully). Bring bug spray in summer.' }
    },
    {
        location: { name: 'Tenney Park', slug: 'tenney-park', description: 'Stone bridges, calm lagoon, willow trees, and open shoreline along Lake Mendota. Easy to move around and find diverse looks in one session.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'No permit required for small portrait sessions. Large/commercial groups may require Parks permit. Contact: Madison Parks (608) 266-4711.', rules_and_restrictions: 'Goose droppings everywhere in summer — choose footwear wisely.', seasonal_availability: 'Best Times: Sunrise = calm water + low traffic. Fall = blazing color + fog over lagoon. Winter = frozen lake + bridge shots.', insider_tips: 'Stone footbridge = best backdrop. Lagoon freezes early → great winter look. Golden hour hits willow tree clusters beautifully.' }
    },
    {
        location: { name: 'Vilas Park + Zoo Area', slug: 'vilas-park-zoo-area', description: 'Lake Wingra shoreline, tall trees, quaint footbridge, charming older houses in surrounding streets. Massive seasonal variety.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'No permit needed for small portrait sessions. Zoo exterior areas okay without permit. No photography inside zoo animal exhibits unless pre-approved.', rules_and_restrictions: 'Road + parking fills fast on weekends.', seasonal_availability: 'Best Times: Morning → calm water. Fall → peak reds/oranges. Snow → postcard look.', insider_tips: 'The little footbridge by the lagoon = ideal. Tree alley toward Monroe St = killer depth shots. Walk 3–5 blocks for charming white/brick homes.' }
    },
    {
        location: { name: 'Olin Park / Olin Turville', slug: 'olin-park-olin-turville', description: 'Best unobstructed Madison skyline view from land. Fields, paths, tall grasses, and oak groves.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'Small portrait sessions allowed. Large paid groups may require permit. Contact: Madison Parks (608) 266-4711.', rules_and_restrictions: 'Windy — hair control becomes a thing.', seasonal_availability: 'Best Times: Sunset: Skyline glows → primary reason to come here.', insider_tips: 'Shoreline grass gives nice depth. Great for silhouettes at sunset. Bring a longer lens to compress skyline.' }
    },
    {
        location: { name: 'Bassett & Washington Warehouse District', slug: 'bassett-washington-warehouse-district', description: 'Industrial brick, alley textures, loading docks, gritty urban tones rarely seen on Madison lists. Perfect for fashion + branding sessions.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for public areas', permit_details: 'No permit for sidewalks/alleys. Private loading docks = ask permission.', rules_and_restrictions: 'Delivery traffic. Stay alert.', seasonal_availability: 'Best Times: Late afternoon → soft reflective light. Cloudy days help soften harsh alley shadows.', insider_tips: 'Great for film-style portraiture. Look for painted brick + rusted metal textures. Night shots with street lights = moody.' }
    },
    {
        location: { name: 'Madison Central Library', slug: 'madison-central-library', description: 'Clean, modern interiors. Big windows for contemporary natural-light portraits. Interesting staircases + metal/wood details.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Yes', permit_cost: 'Free with permission', permit_details: 'MUST request permission for professional/paid shoots. Staff typically allows small, quiet sessions. Contact: (608) 266-6300.', rules_and_restrictions: 'Need to stay out of high-traffic reading areas.', seasonal_availability: 'Best Times: Weekday mornings — fewer people.', insider_tips: 'Third floor stacks → warm tones + symmetry. Glass stair rails = sleek portrait backdrops. Winter-friendly option.' }
    },
    {
        location: { name: 'Alliant Energy Center Grounds', slug: 'alliant-energy-center-grounds', description: 'Wide concrete spaces, long leading lines, metal structures, grassy buffers — a flexible hybrid of industrial + minimalistic outdoor looks.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free with permission', permit_details: 'Outdoor casual/small portrait sessions usually OK. Professional shoots may require permission — case-by-case. Contact: (608) 267-3976.', rules_and_restrictions: 'During big events (concerts/fairs), access is limited or fenced.', seasonal_availability: 'Best Times: Sunset — warm tones over open pavement. Cloudy = ideal soft industrial look.', insider_tips: 'The south end has clean concrete + metal backdrop. Great for full-body branding shots. Minimal foot traffic → stress-free shooting.' }
    },
    {
        location: { name: 'James Madison Park', slug: 'james-madison-park', description: 'Gorgeous Lake Mendota shoreline + open lawn + historic Gates of Heaven building (stone synagogue) for classic, architectural contrast.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'Small shoots OK. Permit required for use of Gates of Heaven building interior. Contact: Madison Parks (608) 266-4711.', rules_and_restrictions: 'Wind and lake spray — hair management needed.', seasonal_availability: 'Best Times: Sunrise → calm water + empty park. Afternoon → harsher but doable with reflectors.', insider_tips: 'Use the stone synagogue for vintage look. Long lens → compress lake beautifully. Great winter ice shots (when safe).' }
    },
    {
        location: { name: 'Monona Terrace Rooftop', slug: 'monona-terrace-rooftop', description: 'Modern architecture + sweeping views of Lake Monona + curved lines + glass. Very clean, bright aesthetic.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free with permission', permit_details: 'Professional photography may require approval. Events have priority → avoid wedding/event blocks. Contact: (608) 261-4093.', rules_and_restrictions: 'Rooftop can be closed for private events — always check first.', seasonal_availability: 'Best Times: Sunset → gold on water + skyline. Blue hour → city glow.', insider_tips: 'Lakefront terrace walkway below also excellent. Curved walls create great negative space. Strong wind — minimal props.' }
    },
    {
        location: { name: 'Law Park (Lake Monona Shoreline)', slug: 'law-park-lake-monona-shoreline', description: 'Lake Monona boardwalk, skyline behind, grassy patches + bikeway minimalism. Clean + classic.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Small portrait sessions allowed.', rules_and_restrictions: 'Busy bike path — timing is key. Traffic noise but manageable.', seasonal_availability: 'Best Times: Evening → skyline glows. Sunrise → soft, dreamy water.', insider_tips: 'Bring longer focal length to compress skyline. Use retaining wall along path for clean lines. Great backup when Monona Terrace is booked.' }
    },
    {
        location: { name: 'Garver Feed Mill', slug: 'garver-feed-mill', description: 'Restored historic feed mill → exposed brick, black steel, glass, artisan spaces. One of Madison\'s hottest wedding + photo backdrops.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for public areas', permit_details: 'Indoor professional photography requires permission. Some outdoor areas public; others private tenant space. Contact: info@garverfeedmill.com.', rules_and_restrictions: 'Indoor areas are tenant-controlled — don\'t assume access.', seasonal_availability: 'Best Times: Late afternoon → soft brick glow. Cloudy → perfect industrial mood.', insider_tips: 'East side path behind building → dreamy evening light. Great winter option for indoor/outdoor hybrid. Parking fills fast on weekends.' }
    },
    {
        location: { name: 'Henry Vilas Beach (Lake Wingra Shore)', slug: 'henry-vilas-beach', description: 'Quiet, natural lakeshore tucked behind Vilas Park. Soft sand, willow trees, and clear sunset views. One of Madison\'s most underrated lakeside gems.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'No permit needed for portrait sessions. Avoid large paid groups (consider Parks permit if >6 people). Contact: Madison Parks (608) 266-4711.', rules_and_restrictions: 'Mosquitoes at dusk — bring repellant.', seasonal_availability: 'Best Times: Sunset for reflections on Lake Wingra. Early morning for glass-still water.', insider_tips: 'Use the shoreline trees for natural framing. Hidden benches for intimate poses. Combine with nearby Vilas Park for variety.' }
    },
    {
        location: { name: 'Capitol Square / State Street Loop', slug: 'capitol-square-state-street-loop', description: 'Urban energy — brick façades, neon lights, storefront reflections, Capitol dome framing State Street. Perfect for downtown lifestyle shoots.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for public areas', permit_details: 'Public sidewalks OK. Avoid private shopfront interiors without permission.', rules_and_restrictions: 'Heavy pedestrian traffic — plan off-hours (Sunday morning ideal).', seasonal_availability: 'Best Times: Golden hour → warm storefront reflections. Night → bokeh lights, cinematic look.', insider_tips: 'Use telephoto lens to compress dome view. Mifflin and King streets = quieter cross streets. Great winter night shots with holiday lights.' }
    },
    {
        location: { name: 'Warner Park', slug: 'warner-park', description: 'Open fields, pines, shoreline trails, and the lagoon. Spacious, calm, ideal for golden-hour family shoots.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'Portrait sessions OK. Large paid groups → Parks permit. Contact: Madison Parks (608) 266-4711.', rules_and_restrictions: 'Baseball games = full parking lots; plan around events.', seasonal_availability: 'Best Times: Evening golden hour over the lagoon. Autumn foliage = vivid orange tones.', insider_tips: 'Lagoon footbridge for symmetry shots. Pine grove near north end = dreamy backlight. Ample open space for long-lens depth.' }
    },
    {
        location: { name: 'B.B. Clarke Beach', slug: 'bb-clarke-beach', description: 'Tucked-away neighborhood beach with wooden pier, willow canopy, and intimate feel. Looks like a Northwoods hideaway five minutes from downtown.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Small sessions OK.', rules_and_restrictions: 'No tripods blocking walkway. Limited parking; come early.', seasonal_availability: 'Best Times: Sunset for soft lake glow. Early morning → mist over Monona.', insider_tips: 'Short pier perfect for symmetry compositions. Nearby Yahara Place Park = bonus greenery. Great quiet alternative to Law Park.' }
    },
    {
        location: { name: 'Goodman Community Center / Atwood Corridor', slug: 'goodman-community-center-atwood-corridor', description: 'Converted industrial buildings with ivy-covered brick, murals, bike path, and café-style charm. East-side vibe meets clean textures.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for public areas', permit_details: 'Outdoor public access fine. Indoor shoots require permission. Contact: (608) 241-1574.', rules_and_restrictions: 'Busy weekends — lots of bikers/pedestrians.', seasonal_availability: 'Best Times: Late afternoon light on brick walls. Morning → cool industrial tones.', insider_tips: 'Murals behind main building = excellent backdrops. Great coffee stops for lifestyle props. Walk the nearby Capital City Trail for extended looks.' }
    },
    {
        location: { name: 'Yahara Place Park (Riverwalk)', slug: 'yahara-place-park-riverwalk', description: 'A tranquil riverwalk lining the Yahara River with willow trees, short docks, and intimate grassy banks. Very serene — perfect for timeless, natural portraits.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Small portrait sessions OK.', rules_and_restrictions: 'No blocking docks / paths. Very limited shooting angles — small space.', seasonal_availability: 'Best Times: Early morning → still water + fog. Sunset → warm reflection across river.', insider_tips: 'Short piers = leading-line compositions. Willows create beautiful soft backdrops. Combine with nearby BB Clarke Beach for variety.' }
    },
    {
        location: { name: 'Burrows Park Boathouse', slug: 'burrows-park-boathouse', description: 'Historic stone boathouse jutting into Lake Mendota. Natural + architectural hybrid. Perfect for dramatic lake-edge images.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Small portrait sessions OK.', rules_and_restrictions: 'Boathouse interior generally not accessible. Wind off Mendota can be intense — bring hair plan.', seasonal_availability: 'Best Times: Sunrise — lake fog = magic. Blue hour — reflection + structure silhouette.', insider_tips: 'Shoot from side angle to feature stone textures. Trees behind building soften harsh frames. Winter → frozen lake = unique platform.' }
    },
    {
        location: { name: 'Alliant Energy Center – Willow Island', slug: 'alliant-energy-center-willow-island', description: 'A quiet, scenic peninsula on Lake Monona — tall grasses, open water, peaceful walking paths. Nature feel without leaving town.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for casual sessions', permit_details: 'Casual portrait sessions generally OK. Events take priority — check ahead.', rules_and_restrictions: 'Can be fenced off during events.', seasonal_availability: 'Best Times: Sunset → warm glow + water reflection. Morning → mist.', insider_tips: 'Tall grasses → dreamy backlit shots. Long lens to compress city shoreline. Bring blanket — wide nature looks.' }
    },
    {
        location: { name: 'Hilldale Shopping Center – Exterior + Parking Terrace', slug: 'hilldale-shopping-center', description: 'Modern open-air shopping center with upscale storefronts, string lights, clean lines, and parking-deck skyline peeks. Great for commercial branding & lifestyle shoots.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free with permission', permit_details: 'Technically private property. Small, low-impact sessions often tolerated. For formal paid sessions → request permission. Contact: Hilldale management (608) 238-6353.', rules_and_restrictions: 'Weekends busy → go early.', seasonal_availability: 'Best Times: Golden hour → beautiful building bounce. Night → string lights + signage glow.', insider_tips: 'Sidewalk seating areas = relaxed lifestyle energy. Parking deck → skyline + negative space. Use storefront reflections for creative shots.' }
    },
    {
        location: { name: 'Hoyt Park', slug: 'hoyt-park', description: 'Rustic stone shelter, winding wooded trails, tall pines, mossy stone steps — feels like a Northwoods getaway inside the city.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'Small portrait sessions allowed. Shelter rentals require permit.', rules_and_restrictions: 'Low light in deep woods — fast lens recommended.', seasonal_availability: 'Best Times: Late afternoon → warm forest glow. Fall → golden canopy.', insider_tips: 'Stone shelter = dramatic backdrop. Pine stands provide tall, moody texture. Great foggy-morning location.' }
    },
    {
        location: { name: 'Lakeshore Nature Preserve – Frautschi Point', slug: 'lakeshore-nature-preserve-frautschi-point', description: 'Secluded woodland point overlooking Lake Mendota, with natural trails, evergreens, and unobstructed water views. Quiet + romantic.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Casual portrait sessions OK. Large commercial setups discouraged.', rules_and_restrictions: 'Parking limited; trails can be muddy after rain.', seasonal_availability: 'Best Times: Sunset → glow over water. Dawn → quiet + mist.', insider_tips: 'Benches with lake views = intimate feels. Fallen trees make great posing elements. Pair with Picnic Point for variety.' }
    },
    {
        location: { name: 'Elver Park', slug: 'elver-park', description: 'Madison\'s largest community park: rolling hills, tall grasses, woodland edges, bridges, and surprisingly varied terrain.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Free for small sessions', permit_details: 'Small shoots OK. Large commercial groups → Parks permit.', rules_and_restrictions: 'Big sledding hill = crowded on snow days.', seasonal_availability: 'Best Times: Golden hour → tall grass glows beautifully. Early fall → peak color.', insider_tips: 'Grassy hills → wide scenic shots. Wooded edges = soft filtered light. Great space for kids to roam naturally.' }
    },
    {
        location: { name: 'Monona Bay Boardwalk (Brittingham Park)', slug: 'monona-bay-boardwalk', description: 'Wooden boardwalk along Monona Bay with skyline reflections, sailboats, open water, and grassy park space.', city: 'Madison', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Small portrait sessions allowed.', rules_and_restrictions: 'No tripods blocking walkway. Lots of joggers + bikers → off-peak best.', seasonal_availability: 'Best Times: Sunset → stunning water reflections. Blue hour → skyline lights.', insider_tips: 'Use the curve in the boardwalk for strong leading lines. Minimalist water compositions → elegant portraits. Bring longer lens to compress skyline.' }
    },
    {
        location: { name: 'Pope Farm Conservancy', slug: 'pope-farm-conservancy', description: '105 acres of rolling hills, prairie restorations, and seasonally, massive sunflower fields. Wide-open pastoral beauty.', city: 'Middleton', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'Varies', permit_cost: 'Ticketed during events', permit_details: 'Small portrait sessions generally OK. Sunflower season often requires ticketed entry. Contact: Middleton Parks (608) 821-8370.', rules_and_restrictions: 'Sunflower event is TICKETED and sells out fast. Plan months ahead.', seasonal_availability: 'Best Times: Late July-August: Sunflower bloom (confirm timing annually). Golden hour: Prairie glows beautifully. Fall: Autumn colors on rolling hills.', insider_tips: 'Arrive early during sunflower season (crowds + parking). Rolling hills create natural depth. Bring wide-angle lens for field shots.' }
    },
    {
        location: { name: 'Pheasant Branch Conservancy', slug: 'pheasant-branch-conservancy', description: '160 acres with rivers, boardwalks, hiking trails, fields, and forests. A true nature escape just outside Madison.', city: 'Middleton', state: 'WI', country: 'USA' },
        intelligence: { permit_status: 'No', permit_cost: 'Free', permit_details: 'Portrait sessions allowed.', rules_and_restrictions: 'Respect wildlife areas. Trails can be muddy — appropriate footwear essential.', seasonal_availability: 'Best Times: Spring: Wildflowers, flowing creeks. Fall: Vibrant foliage. Golden hour: Fields and boardwalks glow.', insider_tips: 'Boardwalk sections = unique elevated angles. Creek areas perfect for adventurous couples. Less crowded than Arboretum.' }
    }
    // --- Location Data Ends Here ---
];

async function seedDatabase() {
  console.log('Starting to seed database...');

  for (const { location, intelligence } of locationsData) {
    // Upsert the location. 'slug' is the unique identifier.
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .upsert(location, { onConflict: 'slug' })
      .select()
      .single();

    if (locationError) {
      console.error(`Error upserting location ${location.name}:`, locationError.message);
      continue; // Skip to the next location if this one fails
    }

    console.log(`Upserted location: ${locationData.name}`);

    // Now upsert the business intelligence data, linking it to the location.
    const intelligenceToInsert = {
      location_id: locationData.id,
      ...intelligence
    };

    const { error: intelligenceError } = await supabase
      .from('location_business_intelligence')
      .upsert(intelligenceToInsert, { onConflict: 'location_id' });

    if (intelligenceError) {
      console.error(`Error upserting intelligence for ${location.name}:`, intelligenceError.message);
    } else {
      console.log(`Upserted intelligence for: ${locationData.name}`);
    }
  }

  console.log('Database seeding complete.');
}

seedDatabase();

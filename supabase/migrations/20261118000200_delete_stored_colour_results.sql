-- Colour-vision results are health-related and are no longer collected: the colour test is off in production and
-- its result stays on the device (deployment audit F08). On 2026-11-18 the owner decided to delete every result
-- already stored. The table itself stays.
DELETE FROM public.colorblind_results;

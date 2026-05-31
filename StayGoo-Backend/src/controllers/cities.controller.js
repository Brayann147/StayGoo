export const getCities = async (req, res) => {
    try {
        const countryCode = req.query.country;
        if (!countryCode) {
            return res.status(400).json({ error: 'Falta el parámetro "country"' });
        }

        const response = await fetch(
            `http://api.geonames.org/searchJSON?country=${countryCode}&featureClass=P&maxRows=100&username=rafaelc26`
        );
        const data = await response.json();

        if (!data || !data.geonames) {
            console.error("GeoNames error:", data);
            return res.status(200).json([]);
        }

        const cities = data.geonames.map(city => ({
            name: city.name,
            lat: city.lat,
            lng: city.lng
        }));

        res.status(200).json(cities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
-- ============================================================================
-- BC ENERGY STEP CODE SEED DATA
-- Official metrics from BC Housing 2017 Metrics Report
-- Source: https://www.bchousing.org/publications/BC-Energy-Step-Code-2017-Metrics-Full.pdf
-- ============================================================================

-- ============================================================================
-- JURISDICTION PROFILES - BC & AB Municipalities
-- ============================================================================

-- Vancouver, BC - Step Code Tier 3, High Seismic, Climate Zone 4
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, spectralAccelerationSa02, stepCodeAdopted, currentStepCodeTier, stepCodeEffectiveDate, nbcEdition, isActive)
VALUES ('BC', 'Vancouver', '4', 2800, -12, 22, 'High', 0.95, true, '3', '2023-01-01', '2024', true);

-- Victoria, BC - Step Code Tier 2, Intermediate Seismic, Climate Zone 4
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, spectralAccelerationSa02, stepCodeAdopted, currentStepCodeTier, stepCodeEffectiveDate, nbcEdition, isActive)
VALUES ('BC', 'Victoria', '4', 2400, -8, 21, 'Intermediate', 0.75, true, '2', '2023-01-01', '2024', true);

-- Kelowna, BC - Step Code Tier 3, Low Seismic, Climate Zone 5
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, spectralAccelerationSa02, stepCodeAdopted, currentStepCodeTier, stepCodeEffectiveDate, nbcEdition, isActive)
VALUES ('BC', 'Kelowna', '5', 3200, -18, 28, 'Low', 0.35, true, '3', '2023-01-01', '2024', true);

-- Prince George, BC - Step Code Tier 3, Low Seismic, Climate Zone 7a
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, spectralAccelerationSa02, stepCodeAdopted, currentStepCodeTier, stepCodeEffectiveDate, nbcEdition, isActive)
VALUES ('BC', 'Prince George', '7a', 5200, -35, 25, 'Low', 0.25, true, '3', '2023-01-01', '2024', true);

-- Calgary, AB - No Step Code, Cold Climate Zone 7a
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, stepCodeAdopted, nbcEdition, localAmendments, isActive)
VALUES ('AB', 'Calgary', '7a', 5500, -37, 28, 'Low', false, '2023', '["Calgary Fire Bylaw 2022-15", "Calgary Building Bylaw 2023-04"]', true);

-- Edmonton, AB - No Step Code, Extreme Cold Zone 7a
INSERT INTO jurisdictionProfiles (province, municipality, climateZone, heatingDegreeDays, designTemperatureWinter, designTemperatureSummer, seismicZone, stepCodeAdopted, nbcEdition, isActive)
VALUES ('AB', 'Edmonton', '7a', 5500, -37, 28, 'Low', false, '2023', true);

-- ============================================================================
-- STEP CODE TIERS - Part 9 Residential (Houses, Townhomes, Small MURBs)
-- Climate Zone 4 (Vancouver Area) - Official BC Housing Metrics
-- ============================================================================

-- Zone 4, Step 1 (Reference)
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part9_single_family', '4', 50.00, 80.00, 0.80, NULL, 'BC Energy Step Code 2017, Zone 4, Step 1', '2017-01-01', true);

-- Zone 4, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part9_single_family', '4', 45.00, 60.00, 0.85, 3.00, 'BC Energy Step Code 2017, Zone 4, Step 2', '2017-01-01', true);

-- Zone 4, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part9_single_family', '4', 30.00, 50.00, 0.88, 2.50, 'BC Energy Step Code 2017, Zone 4, Step 3', '2017-01-01', true);

-- Zone 4, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part9_single_family', '4', 20.00, 40.00, 0.90, 1.50, 'BC Energy Step Code 2017, Zone 4, Step 4', '2017-01-01', true);

-- Zone 4, Step 5
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('5', 'part9_single_family', '4', 15.00, 25.00, 0.95, 1.00, 'BC Energy Step Code 2017, Zone 4, Step 5', '2017-01-01', true);

-- ============================================================================
-- STEP CODE TIERS - Part 9 Residential, Climate Zone 5 (Interior/Okanagan)
-- ============================================================================

-- Zone 5, Step 1 (Reference)
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part9_single_family', '5', 65.00, 100.00, 0.80, NULL, 'BC Energy Step Code 2017, Zone 5, Step 1', '2017-01-01', true);

-- Zone 5, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part9_single_family', '5', 45.00, 70.00, 0.85, 3.00, 'BC Energy Step Code 2017, Zone 5, Step 2', '2017-01-01', true);

-- Zone 5, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part9_single_family', '5', 40.00, 65.00, 0.88, 2.50, 'BC Energy Step Code 2017, Zone 5, Step 3', '2017-01-01', true);

-- Zone 5, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part9_single_family', '5', 20.00, 50.00, 0.90, 1.50, 'BC Energy Step Code 2017, Zone 5, Step 4', '2017-01-01', true);

-- Zone 5, Step 5
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('5', 'part9_single_family', '5', 15.00, 25.00, 0.95, 1.00, 'BC Energy Step Code 2017, Zone 5, Step 5', '2017-01-01', true);

-- ============================================================================
-- STEP CODE TIERS - Part 9 Residential, Zones 6, 7a, 7b, 8 (Northern/Cold)
-- ============================================================================

-- Zones 6-8, Step 1 (Reference)
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part9_single_family', '6', 75.00, 115.00, 0.80, NULL, 'BC Energy Step Code 2017, Zone 6-8, Step 1', '2017-01-01', true);

-- Zones 6-8, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part9_single_family', '6', 70.00, 100.00, 0.85, 3.00, 'BC Energy Step Code 2017, Zone 6-8, Step 2', '2017-01-01', true);

-- Zones 6-8, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part9_single_family', '6', 60.00, 85.00, 0.88, 2.50, 'BC Energy Step Code 2017, Zone 6-8, Step 3', '2017-01-01', true);

-- Zones 6-8, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part9_single_family', '6', 50.00, 55.00, 0.90, 1.50, 'BC Energy Step Code 2017, Zone 6-8, Step 4', '2017-01-01', true);

-- Zones 6-8, Step 5
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('5', 'part9_single_family', '6', 15.00, 25.00, 0.95, 1.00, 'BC Energy Step Code 2017, Zone 6-8, Step 5', '2017-01-01', true);

-- ============================================================================
-- STEP CODE TIERS - Part 3 Commercial (Climate Zone 4 Only)
-- ============================================================================

-- Part 3 MURB (Multi-Unit Residential), Step 1
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part3_murb', '4', 45.00, 165.00, 0.80, NULL, 'BC Energy Step Code 2017, Part 3 MURB, Step 1', '2017-01-01', true);

-- Part 3 MURB, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part3_murb', '4', 40.00, 150.00, 0.85, 3.00, 'BC Energy Step Code 2017, Part 3 MURB, Step 2', '2017-01-01', true);

-- Part 3 MURB, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part3_murb', '4', 35.00, 130.00, 0.88, 2.50, 'BC Energy Step Code 2017, Part 3 MURB, Step 3', '2017-01-01', true);

-- Part 3 MURB, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part3_murb', '4', 25.00, 100.00, 0.90, 1.50, 'BC Energy Step Code 2017, Part 3 MURB, Step 4', '2017-01-01', true);

-- Part 3 Office, Step 1
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part3_office', '4', 40.00, 220.00, 0.80, NULL, 'BC Energy Step Code 2017, Part 3 Office, Step 1', '2017-01-01', true);

-- Part 3 Office, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part3_office', '4', 35.00, 200.00, 0.85, 3.00, 'BC Energy Step Code 2017, Part 3 Office, Step 2', '2017-01-01', true);

-- Part 3 Office, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part3_office', '4', 30.00, 175.00, 0.88, 2.50, 'BC Energy Step Code 2017, Part 3 Office, Step 3', '2017-01-01', true);

-- Part 3 Office, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part3_office', '4', 20.00, 140.00, 0.90, 1.50, 'BC Energy Step Code 2017, Part 3 Office, Step 4', '2017-01-01', true);

-- Part 3 Retail, Step 1
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('1', 'part3_retail', '4', 40.00, 350.00, 0.80, NULL, 'BC Energy Step Code 2017, Part 3 Retail, Step 1', '2017-01-01', true);

-- Part 3 Retail, Step 2
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('2', 'part3_retail', '4', 35.00, 320.00, 0.85, 3.00, 'BC Energy Step Code 2017, Part 3 Retail, Step 2', '2017-01-01', true);

-- Part 3 Retail, Step 3
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('3', 'part3_retail', '4', 30.00, 280.00, 0.88, 2.50, 'BC Energy Step Code 2017, Part 3 Retail, Step 3', '2017-01-01', true);

-- Part 3 Retail, Step 4
INSERT INTO stepCodeTiers (tier, buildingType, climateZone, tediTarget, teuiTarget, mechEfficiencyMin, airtightnessMax, codeReference, effectiveDate, isActive)
VALUES ('4', 'part3_retail', '4', 20.00, 220.00, 0.90, 1.50, 'BC Energy Step Code 2017, Part 3 Retail, Step 4', '2017-01-01', true);

-- ============================================================================
-- UI TRANSLATIONS - Bilingual EN/FR Support for BC
-- ============================================================================

-- Occupancy labels
INSERT INTO uiTranslations (`key`, en, fr, context) VALUES
('occupancy.assembly', 'Assembly', 'Assemblée', 'occupancy'),
('occupancy.residential', 'Residential', 'Résidentiel', 'occupancy'),
('occupancy.business', 'Business/Office', 'Bureau/Affaires', 'occupancy'),
('occupancy.institutional', 'Institutional', 'Institutionnel', 'occupancy'),
('occupancy.storage', 'Storage', 'Entreposage', 'occupancy');

-- Step Code calculator labels
INSERT INTO uiTranslations (`key`, en, fr, context) VALUES
('calculator.step_code.title', 'Step Code Calculator', 'Calculateur du Code Échelon', 'calculator'),
('calculator.step_code.subtitle', 'BC Energy Step Code Compliance Analysis', 'Analyse de Conformité du Code Échelon Énergétique de la C.-B.', 'calculator'),
('calculator.tedi.label', 'Thermal Energy Demand Intensity (TEDI)', 'Intensité de la Demande Énergétique Thermique (TEDI)', 'calculator'),
('calculator.teui.label', 'Total Energy Use Intensity (TEUI)', 'Intensité Totale de la Consommation Énergétique (TEUI)', 'calculator'),
('calculator.meui.label', 'Mechanical Energy Use Intensity (MEUI)', 'Intensité de la Consommation Énergétique Mécanique (MEUI)', 'calculator'),
('calculator.airtightness.label', 'Airtightness (ACH₅₀)', 'Étanchéité à l\'Air (ACH₅₀)', 'calculator'),
('calculator.tier.label', 'Step Code Tier', 'Niveau du Code Échelon', 'calculator'),
('calculator.building_type.label', 'Building Type', 'Type de Bâtiment', 'calculator'),
('calculator.climate_zone.label', 'Climate Zone', 'Zone Climatique', 'calculator');

-- Report labels
INSERT INTO uiTranslations (`key`, en, fr, context) VALUES
('report.compliant', 'Compliant', 'Conforme', 'report'),
('report.non_compliant', 'Non-Compliant', 'Non conforme', 'report'),
('report.conditional', 'Conditional', 'Conditionnel', 'report'),
('report.pass', 'Pass', 'Réussi', 'report'),
('report.fail', 'Fail', 'Échoué', 'report'),
('report.tedi_target', 'TEDI Target', 'Cible TEDI', 'report'),
('report.tedi_modelled', 'TEDI Modelled', 'TEDI Modélisé', 'report'),
('report.teui_target', 'TEUI Target', 'Cible TEUI', 'report'),
('report.teui_modelled', 'TEUI Modelled', 'TEUI Modélisé', 'report'),
('report.professional_seal', 'Professional Engineer Seal', 'Sceau de l\'Ingénieur Professionnel', 'report'),
('report.signature_date', 'Signature Date', 'Date de Signature', 'report');

-- Error and validation messages
INSERT INTO uiTranslations (`key`, en, fr, context) VALUES
('error.invalid_tier', 'Invalid Step Code tier selected', 'Niveau du Code Échelon invalide sélectionné', 'error'),
('error.missing_data', 'Required energy data is missing', 'Les données énergétiques requises sont manquantes', 'error'),
('error.calculation_failed', 'Compliance calculation failed', 'Le calcul de conformité a échoué', 'error'),
('validation.tedi_required', 'TEDI value is required', 'La valeur TEDI est requise', 'validation'),
('validation.teui_required', 'TEUI value is required', 'La valeur TEUI est requise', 'validation');

-- ============================================================================
-- PROFESSIONAL SEALS - Sample Engineer/Architect Credentials
-- ============================================================================

-- Note: These are placeholder entries. Real entries would be created when professionals register.
-- INSERT INTO professionalSeals (userId, engineerName, licenseNumber, association, associationProvince, licenseExpiry, isActive)
-- VALUES (1, 'Dr. Jane Smith, P.Eng.', 'EGBC-12345', 'EGBC', 'BC', '2026-12-31', true);

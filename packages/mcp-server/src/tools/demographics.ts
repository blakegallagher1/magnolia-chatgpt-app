import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MagnoliaClient } from '@magnolia/gpc-client';
import { toToolError } from '../utils/errors.js';

/**
 * Register demographic data tools.
 *
 * Tools:
 *  - get_demographics: Census ACS demographic profile by geography
 */
export function registerDemographicsTools(server: McpServer, client: MagnoliaClient): void {
  server.tool(
    'get_demographics',
    'Fetch Census ACS demographic profile for a geography: population, household income, age distribution, housing metrics, employment, and educational attainment. Supports census tract, ZIP code, parish/county, MSA, or state geographies. Essential for market analysis and site selection.',
    {
      geography: z
        .string()
        .describe(
          'Geographic area to profile. Examples: "East Baton Rouge Parish, LA", "70806" (ZIP code), "Census Tract 123.45, East Baton Rouge", "Baton Rouge MSA", "Louisiana"',
        ),
      acs_year: z
        .number()
        .int()
        .min(2015)
        .max(2024)
        .optional()
        .describe('ACS vintage year (defaults to most recent 5-year ACS)'),
      include_trends: z
        .boolean()
        .default(false)
        .describe('Include 5-year and 10-year population/income growth trends'),
    },
    async (args, _extra) => {
      try {
        const demo = await client.market.getDemographics(args.geography, args.acs_year);

        const incomeFormatted = `$${demo.median_household_income.toLocaleString()}`;
        const pcIncomeFormatted = `$${demo.per_capita_income.toLocaleString()}`;
        const homeValueFormatted = `$${demo.median_home_value.toLocaleString()}`;

        return {
          structuredContent: {
            geography: demo.geography,
            fips: demo.fips,
            acs_year: demo.acs_year,
            total_population: demo.total_population,
            median_household_income: demo.median_household_income,
            per_capita_income: demo.per_capita_income,
            median_age: demo.median_age,
            owner_occupied_rate: demo.owner_occupied_rate,
            median_home_value: demo.median_home_value,
            pop_growth_5yr: demo.pop_growth_5yr,
            unemployment_rate: demo.unemployment_rate,
            bachelors_plus_rate: demo.bachelors_plus_rate,
          },
          content: [
            {
              type: 'text' as const,
              text: [
                `## Demographics — ${demo.geography} (ACS ${demo.acs_year})`,
                `**Population:** ${demo.total_population.toLocaleString()}${demo.pop_growth_5yr != null ? ` (${demo.pop_growth_5yr >= 0 ? '+' : ''}${(demo.pop_growth_5yr * 100).toFixed(1)}% 5yr growth)` : ''}`,
                `**Median HH Income:** ${incomeFormatted} | **Per Capita:** ${pcIncomeFormatted}`,
                `**Median Age:** ${demo.median_age}`,
                `**Median Home Value:** ${homeValueFormatted} | **Owner-Occupied:** ${(demo.owner_occupied_rate * 100).toFixed(1)}%`,
                demo.unemployment_rate != null
                  ? `**Unemployment:** ${(demo.unemployment_rate * 100).toFixed(1)}%`
                  : '',
                demo.bachelors_plus_rate != null
                  ? `**Bachelor's+:** ${(demo.bachelors_plus_rate * 100).toFixed(1)}%`
                  : '',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
          _meta: {
            widget: 'market-report',
          },
        };
      } catch (error) {
        return toToolError(error, 'get_demographics');
      }
    },
  );
}

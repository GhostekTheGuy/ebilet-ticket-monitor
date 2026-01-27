import { NextResponse } from 'next/server';

const API_URL = 'https://sklep.ebilet.pl/api/event/getsectorfreeseatscount';
const API_PARAMS = {
  eid: '218143106950758457',
  sids: '{"334:335:336":[696,697,698,699,560,582,595,596,597,598,583,584,585,586,701,587,588,589,590,621,599,600,601,602,606,676,677,678,679,692,693,700,682,683,685,688,689,690,686,695,681,691,674,675,694]}',
  ec: 'null',
  exid: '',
  tid: '0'
};

// Map numeric API IDs to string sector IDs used in SECTORS
const NUMERIC_TO_STRING_ID: Record<string, string> = {
  "696": "218143106950759092", // D11
  "697": "218143106950759093", // D14
  "698": "218143106950759094", // D15
  "699": "218143106950758960", // PŁYTA - GA
  "560": "218143106950759095", // D16
  "582": "218143106950759096", // D17
  "595": "218143106950759097", // D20
  "596": "218143106950759098", // V01
  "597": "218143106950759099", // V02
  "598": "218143106950759100", // V04
  "583": "218143106950759101", // V05
  "584": "218143106950758982", // V03
  "585": "218143106950758983", // G34
  "586": "218143106950758984", // G33
  "701": "218143106950758985", // G32
  "587": "218143106950758986", // G31
  "588": "218143106950758987", // G26
  "589": "218143106950758988", // G25
  "590": "218143106950758989", // G24
  "621": "218143106950758990", // G23
  "599": "218143106950758995", // G27
  "600": "218143106950758996", // G30
  "601": "218143106950758997", // G29
  "602": "218143106950758998", // G28
  "606": "218143106950758999", // D13
  "676": "218143106950759000", // D12
  "677": "218143106950759001", // D18
  "678": "218143106950759002", // D19
  "679": "218143106950759006", // K4
  "692": "218143106950759074", // G35
  "693": "218143106950759075", // G36
  "700": "218143106950759076", // G37
  "682": "218143106950759077", // G1
  "683": "218143106950759078", // G2
  "685": "218143106950759079", // G3
  "688": "218143106950759081", // G22
  "689": "218143106950759082", // G21
  "690": "218143106950759083", // G20
  "686": "218143106950759085", // G18
  "695": "218143106950759086", // G19
  "681": "218143106950759088", // C01
  "691": "218143106950759089", // C02
  "674": "218143106950759090", // C03
  "675": "218143106950759091", // C04
  "694": "218143106950759021", // K2
};

export async function GET() {
  try {
    const url = new URL(API_URL);
    for (const [key, value] of Object.entries(API_PARAMS)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[v0] eBilet API error:', response.status);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Convert numeric IDs to string IDs
    const convertedSfc: Record<string, number> = {};
    for (const [numericId, count] of Object.entries(data.sfc || {})) {
      const stringId = NUMERIC_TO_STRING_ID[numericId];
      if (stringId) {
        convertedSfc[stringId] = count as number;
      }
    }

    return NextResponse.json({
      sfc: convertedSfc
    });
  } catch (error) {
    console.error('[v0] Error fetching from eBilet API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket data' },
      { status: 500 }
    );
  }
}

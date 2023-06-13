import { Locator, Page } from '@playwright/test';

class PlaywrightScenarioPage {
  readonly getRollingStockSelector: Locator;

  readonly getSpeedLimitSelector: Locator;

  readonly getItineraryModule: Locator;

  readonly getItineraryOrigin: Locator;

  readonly getItinenaryDestination: Locator;

  readonly getItineraryVias: Locator;

  readonly getTrainLabels: Locator;

  readonly getTrainSchedule: Locator;

  readonly getMapModule: Locator;

  readonly getSettingSimulationBtn: Locator;

  constructor(readonly page: Page) {
    this.getRollingStockSelector = page.getByTestId('rollingstock-selector');
    this.getSpeedLimitSelector = page.getByTestId('speed-limit-by-tag-selector');
    this.getItineraryModule = page.getByTestId('itinerary');
    this.getItineraryOrigin = this.getItineraryModule
      .getByTestId('display-itinerary')
      .getByTestId('itinerary-origin');
    this.getItinenaryDestination = this.getItineraryModule
      .getByTestId('display-itinerary')
      .getByTestId('itinerary-destination');
    this.getItineraryVias = this.getItineraryModule
      .getByTestId('display-itinerary')
      .getByTestId('itinerary-vias');
    this.getTrainLabels = page.getByTestId('add-train-labels');
    this.getTrainSchedule = page.getByTestId('add-train-schedules');
    this.getMapModule = page.getByTestId('map');
    this.getSettingSimulationBtn = page.locator('span', { hasText: 'Paramètres de simulation' });
  }

  async openTabByText(text: string) {
    await this.page.locator('span', { hasText: text }).click();
  }
}

export default PlaywrightScenarioPage;
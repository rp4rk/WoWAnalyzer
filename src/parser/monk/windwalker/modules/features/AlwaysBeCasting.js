import React from 'react';

import CoreAlwaysBeCasting from 'parser/shared/modules/AlwaysBeCasting';

import { formatPercentage } from 'common/format';
import { STATISTIC_ORDER } from 'interface/others/StatisticBox';

class AlwaysBeCasting extends CoreAlwaysBeCasting {
  get downtimePercentage() {
    return this.totalTimeWasted / this.owner.fightDuration;
  }

  get suggestionThresholds() {
    return {
      actual: this.downtimePercentage,
      isGreaterThan: {
        minor: 0.2,
        average: 0.3,
        major: 0.4,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) => {
        return suggest(<span>Your downtime can be improved. Try to Always Be Casting (ABC), try to reduce the delay between casting spells.</span>)
          .icon('spell_mage_altertime')
          .actual(`${formatPercentage(actual)}% downtime`)
          .recommended(`<${formatPercentage(recommended)}% is recommended`);
      });
  }

  statisticOrder = STATISTIC_ORDER.CORE(10);
}

export default AlwaysBeCasting;

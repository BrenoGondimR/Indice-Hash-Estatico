<template>
  <svg class="stat-circle" width="150" viewBox="0 0 20 20">
    <circle class="bg" cx="10" cy="10" r="8"/>
    <circle class="progress" cx="10" cy="10" r="8" :style="circleStyle"/>
    <text x="10" y="10.5" text-anchor="middle">{{ percentage }}%</text>
  </svg>
</template>

<script>
export default {
  name: 'ProgressCircle',
  props: {
    percentage: {
      type: Number,
      required: true
    }
  },
  computed: {
    circleStyle() {
      const circumference = 2 * Math.PI * 8; // 2πr for the circumference
      // Ajustando o cálculo para inverter o preenchimento
      const offset = circumference * ((100 - this.percentage) / 100);
      return {
        'fill': 'none',
        'strokeDasharray': `${circumference} ${circumference}`,
        'strokeDashoffset': circumference - offset,
        'transition': 'stroke-dashoffset 0.4s ease-in-out',
      };
    }
  }
};
</script>

<style scoped>
.stat-circle {
  .bg {
    fill: none;
    stroke: #f1f1f1;
    stroke-width: 2;
  }
  .progress {
    fill: none;
    stroke: #2ecc71;
    stroke-width: 2;
    stroke-linecap: round;
  }
  text {
    font-size: 3px;
    fill: #555;
  }
}
</style>

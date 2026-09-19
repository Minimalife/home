// F-01 계산·검증 함수 (app.html에서 사용) — docs/requirements.md R-01~R-03 대응

// 두 값의 변화율(%)을 계산해 "+xx.x%" 또는 "-xx.x%" 문자열로 반환 (UT-01)
function calcChangeRate(before, after) {
  if (typeof before !== "number" || typeof after !== "number" || before === 0) return null;
  const rate = ((after - before) / before) * 100;
  const rounded = Math.round(rate * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return sign + rounded.toFixed(1) + "%";
}

// 지역·구 선택값을 검증해 안내 문구를 반환(문제 없으면 null) (UT-02, UT-03)
function validateSelection(region, gu) {
  if (!region) return "지역을 선택해주세요";
  if (region === "부산" && !gu) return "부산은 구까지 선택해주세요";
  return null;
}

// 데이터 조회 키 생성 (예: "부산" + "연제구" → "부산-연제구")
function getRegionKey(region, gu) {
  if (region === "부산" && gu) return "부산-" + gu;
  return region;
}

function formatNum(n) {
  return n.toLocaleString("ko-KR");
}

function cardHtml(title, valueText, rate, meta) {
  const cls = rate && rate.startsWith("-") ? "down" : "up";
  const rateHtml = rate ? `<div class="big ${cls}">${rate}</div>` : "";
  return `<div class="num-card"><div class="card-title">${title}</div>${rateHtml}<div class="value">${valueText}</div><div class="meta">${meta}</div></div>`;
}

function emptyCardHtml(title, msg) {
  return `<div class="num-card empty"><div class="card-title">${title}</div><div class="empty-msg">${msg}</div></div>`;
}

function renderResult(region, gu) {
  const resultEl = document.getElementById("result");
  const errorEl = document.getElementById("error-msg");

  const err = validateSelection(region, gu);
  if (err) {
    resultEl.innerHTML = "";
    errorEl.textContent = err;
    errorEl.style.display = "block";
    return;
  }
  errorEl.style.display = "none";
  errorEl.textContent = "";

  if (typeof window.REGION_DATA === "undefined") {
    resultEl.innerHTML = '<div class="err-box">데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
    return;
  }

  const D = window.REGION_DATA;
  const key = getRegionKey(region, gu);
  const cityKey = region;
  let html = "";

  // D4 가격지수
  const pi = D.price_index[key];
  if (pi) {
    html += cardHtml("가격지수(2026-06=100)", pi.jul + " → " + pi.aug, calcChangeRate(pi.jul, pi.aug), D.meta.price_index_source + " · " + D.meta.price_index_period);
  } else {
    html += emptyCardHtml("가격지수", "자료 없음");
  }

  // D3 미분양 (부산 연제구만)
  const vac = D.vacancy[key];
  if (vac) {
    html += cardHtml("미분양(전용 60~85㎡)", vac.jul + "세대 → " + vac.aug + "세대", calcChangeRate(vac.jul, vac.aug), D.meta.vacancy_source + " · " + D.meta.vacancy_period);
  } else {
    html += emptyCardHtml("미분양", "자료 없음(부산 연제구만 제공)");
  }

  // D5 민간 초기분양률 (시·도 단위)
  const rate5 = D.initial_sale_rate[cityKey];
  if (rate5) {
    const unitNote = gu ? cityKey + " 전체 기준(구 단위 자료 없음)" : D.meta.sale_rate_period;
    html += cardHtml("민간 초기분양률", rate5.q1 + "% → " + rate5.q2 + "%", calcChangeRate(rate5.q1, rate5.q2), D.meta.sale_rate_source + " · " + unitNote);
  } else {
    html += emptyCardHtml("민간 초기분양률", "자료 없음");
  }

  // D8 5년 분양가 추이 (시·도 단위)
  const p5 = D.price_5y[cityKey];
  if (p5) {
    const first = p5.values[0];
    const last = p5.values[p5.values.length - 1];
    const unitNote = gu ? cityKey + " 전체 기준(구 단위 자료 없음)" : p5.labels[0] + " → " + p5.labels[p5.labels.length - 1];
    html += cardHtml("5년 분양가 추이(㎡당 천원)", formatNum(first) + " → " + formatNum(last), calcChangeRate(first, last), D.meta.price5y_source + " · " + unitNote);
  } else {
    html += emptyCardHtml("5년 분양가 추이", "자료 없음");
  }

  resultEl.innerHTML = html;
}

function initApp() {
  const regionSel = document.getElementById("region");
  const guWrap = document.getElementById("gu-wrap");
  const guSel = document.getElementById("gu");
  const btn = document.getElementById("compare-btn");

  if (!regionSel || !guWrap || !guSel || !btn) {
    return; // 화면 요소가 아직 준비되지 않음 — DOMContentLoaded 재시도로 이미 처리됨
  }

  regionSel.addEventListener("change", function () {
    if (regionSel.value === "부산") {
      guWrap.style.display = "block";
    } else {
      guWrap.style.display = "none";
      guSel.value = "";
    }
  });

  btn.addEventListener("click", function () {
    renderResult(regionSel.value, guSel.value);
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}

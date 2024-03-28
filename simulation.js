/* 
    Hospital LOS simulation 
    
    Written by John LaRusic / (compasshealth.ca)
*/

// Runs basic hospital census simulation
//   avg_admits: average daily admissions
//   avg_los: average length of stay
//   sim_days: number of days to simulate
//   cold_days: number of days to ignore for model warm-up

/**
 * 
 * @param {number} avg_admits Average daily admissions
 * @param {number} avg_los Average length of stay
 * @param {int} sim_days Simulation days
 * @param {int} cold_days "Cold start" days
 * @returns {object} Simulation results {total_days, admits, los, avg_admits, 
 *                   avg_los, avg_census, census}
 */
function run_sim(avg_admits, avg_los, sim_days, cold_days) {
    shape = 1.0;
    mu = Math.log(avg_los - 0.5) - shape * shape / 2;

    var l = lognormal.factory(mu, shape);
    var p = poisson.factory(avg_admits);
    get_los = function () {
        return Math.ceil(l());
    }

    total_admits = 0;
    total_los = 0;
    total_days = cold_days + sim_days;
    admits_hist = [];
    los_hist = [];
    census = Array(total_days).fill(0);

    // Keep track of admits and LOS once we've passed the cold start
    run_total_admits = 0;
    run_total_los = 0;

    // For each day, simulation total admissions
    for (var i = 0; i < cold_days + sim_days; i++) {
        admits = p();
        if (i >= cold_days) {
            admits_hist.push(admits);
            run_total_admits += admits;
        }

        // For each admission, simulate a LOS
        for (var j = 0; j < admits; j++) {
            los = get_los();
            if (i >= cold_days) {
                los_hist.push(los);
                run_total_los += los
            }

            // Add to running census array
            for (var k = 0; k < los; k++) {
                if (i + k < total_days) {
                    census[i + k]++;
                }
            }
        }
    }

    return {
        "total_days": sim_days,
        "admits": admits_hist,
        "los": los_hist,
        "avg_admits": run_total_admits / sim_days,
        "avg_los": run_total_los / run_total_admits,
        "avg_census": run_total_los / sim_days,
        "census": census.slice(cold_days)
    };
}


/**
 * Percentile stats for given array
 * @param {number[]} array Array to calculate stats
 * @returns {object} Percentile stats {p05, p25, p50, p75, p95, min, max)
 */
function get_stats(array) {
    get_percentile = function (array, p) {
        return array[Math.ceil(array.length * p) - 1];
    }
    get_average = function (array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    }
    get_stddev = function (array, avg) {
        return Math.sqrt(array.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / array.length);
    }

    a = array.slice().sort(function (a, b) { return a - b; });
    avg = get_average(a);
    return {
        "avg": avg,
        "stdev": get_stddev(a, avg),
        "p05": get_percentile(a, 0.05),
        "p25": get_percentile(a, 0.25),
        "p50": get_percentile(a, 0.50),
        "p75": get_percentile(a, 0.75),
        "p95": get_percentile(a, 0.95),
        "min": a[0],
        "max": a[array.length - 1]
    };
}

/**
 * Return probability density function of array
 * @param {number[]} array Array to calculate PDF
 * @returns {number[]} Probability density function 
 */
function get_pdf(array) {
    if (array.length == 0) {
        return [];
    }

    a = array.slice().sort(function (a, b) { return a - b; });
    max = a[a.length - 1];

    var pdf = Array(max + 1).fill(0);
    for (var i = 0; i < a.length; i++) {
        pdf[a[i]]++;
    }

    return pdf.map(i => i / a.length);
}
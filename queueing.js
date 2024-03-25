/* 
    Queueing Theory calculations

    Written by John LaRusic / (compasshealth.ca)
    Based on Armann Ingolfsson's Queueing ToolPak (https://queueingtoolpak.org/)
*/

class MMCQueue {

    /**
     * Constructor.
     * 
     * @param {number} lambda Arrival rate (per unit of time).
     * @param {number} mu Service rate (per unit of time).
     * @param {int} c System capacity.
     */
    constructor(lambda, mu, c = null) {
        // Set default value for capacity if not provided
        if (c == null) {
            c = Math.ceil((lambda / mu) + 0.5);
        }

        // Simple error checking of passed values
        if (lambda <= 0) {
            throw new Error('Arrival rate [lambda] must be greater than 0');
        }
        if (mu <= 0) {
            throw new Error('Service rate [mu] must be greater than 0');
        }
        if (c <= 0) {
            throw new Error('System capacity [c] must be greater than 0');
        }

        // Ensure c is an integer
        if (c != Math.round(c)) {
            throw new Error('System capacity [c] must be an integer');
        }

        this.lambda = lambda;
        this.mu = mu;
        this.c = c;
        this.rho = lambda / (mu * c);

        // Ensure utilization is less than 1
        if (this.rho >= 1) {
            throw new Error('Average arrivals and service rate exceed system capacity (i.e., util rate must be less than 1)');
        }

        // Calculate sum/term helper used in many queueing calculations
        this.sum = 0;
        this.term = 1;
        for (let i = 0; i < this.c; i++) {
            this.sum += this.term;
            this.term *= (this.lambda / this.mu) / (i + 1);
        }
    }

    /**
     * Calculate the average number of customers in the system.
     * @returns {number} Average number of customers in the system.
      */
    Util() {
        return this.rho;
    }

    /**
     * Calculates probability that the system is empty.
     * @returns {number} Probability (0 to 1) that the system is empty.
     */
    P0() {
        return 1 / (this.sum + (this.term / (1 - this.rho)));;
    }

    /**
     * Calculates expected number in queue
     * @returns {number} Expected number in queue.
     */
    Lq() {
        return (this.term * this.rho) / Math.pow(1 - this.rho, 2) * (1 / (this.sum + (this.term / (1 - this.rho))));
    }

    /**
     * Calculates expected number in system
     * @returns {number} Expected number in system.
     */
    L() {
        return this.Lq() + (this.lambda / this.mu);
    }

    /**
     * Calculates expected wait time in queue
     * @returns {number} Expected wait time in queue.
     */
    Wq() {
        return this.Lq() / this.lambda;
    }

    /**
     * Calculates expected wait time in system
     * @returns {number} Expected wait time in system.
     */
    W() {
        return (this.Lq() / this.lambda) + (1 / this.mu);
    }

    p_PrWait(lamda, mu, c) {
        let p = 1;
        let q = 1;
        let qTemp = null;

        let rho = lamda / (mu * c);

        for (let n = 1; n <= c; n++) {
            p = lamda / (n * mu) * p;
            qTemp = q;
            q += p;
        }
        return 1 - qTemp / (q + p * rho / (1 - rho));
    }

    /**
     * Calculates probability that an arriving customer has to wait in queue.
     * @returns {number} Probability (0 to 1) that an arriving customer has to wait in queue.
     */
    PrWait() {
        return this.p_PrWait(this.lambda, this.mu, this.c);
    }

    /**
     * Calculate number of servers needed to meet target service level.
     * @param {number} threshold: target max wait time.
     * @param {number} service_level: target service level (0 to 1).
     * @returns {int} Number of servers needed to meet target service level.
     */
    MinServers(threshold, service_level) {
        let found_min = false;
        let servers = Math.floor((this.lambda / this.mu) + 0.5);
        if (servers == 0) { servers = 1; }

        while (!found_min && servers < 1000) {
            let rho = this.lambda / (servers * this.mu);
            if (rho <= 1) {
                let temp1 = this.p_PrWait(this.lambda, this.mu, servers);
                let temp2 = Math.exp(-servers * this.mu * (1 - rho) * threshold);
                if (temp1 * temp2 <= (1 - service_level)) {
                    return servers
                }
            }
            servers++;
        }

        return null;
    }

    /**
     * Calculate current service level based on given threshold.
     * @param {number} threshold: target max wait time.
     * @returns {number} Acheived service level (0 to 1).
     */
    ServiceLevel(threshold) {
        let temp1 = this.PrWait();
        let temp2 = Math.exp(-this.c * this.mu * (1 - this.rho) * threshold);
        return 1 - (temp1 * temp2);
    }

}





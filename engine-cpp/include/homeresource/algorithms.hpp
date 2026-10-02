#pragma once

#include <vector>
#include <cmath>
#include <numeric>
#include <stdexcept>

namespace homeresource {

struct BaselineResult {
    double mean;
    double std_dev;
    double min_val;
    double max_val;
    size_t count;
};

// Vectorized statistical computation
BaselineResult compute_fast_baseline(const std::vector<double>& values);

// Fast batch z-score anomaly detection
std::vector<double> compute_batch_z_scores(const std::vector<double>& values, double mean, double std_dev);

} // namespace homeresource

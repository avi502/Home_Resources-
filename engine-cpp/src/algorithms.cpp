#include "homeresource/algorithms.hpp"

namespace homeresource {

BaselineResult compute_fast_baseline(const std::vector<double>& values) {
    if (values.empty()) {
        return {0.0, 0.0, 0.0, 0.0, 0};
    }

    double sum = std::accumulate(values.begin(), values.end(), 0.0);
    double mean = sum / values.size();

    double sq_diff_sum = 0.0;
    double min_val = values[0];
    double max_val = values[0];

    for (const double val : values) {
        sq_diff_sum += (val - mean) * (val - mean);
        if (val < min_val) min_val = val;
        if (val > max_val) max_val = val;
    }

    double variance = (values.size() > 1) ? (sq_diff_sum / (values.size() - 1)) : 0.0;
    double std_dev = std::sqrt(variance);

    return {mean, std_dev, min_val, max_val, values.size()};
}

std::vector<double> compute_batch_z_scores(const std::vector<double>& values, double mean, double std_dev) {
    std::vector<double> z_scores;
    z_scores.reserve(values.size());

    if (std_dev <= 0.0) {
        z_scores.assign(values.size(), 0.0);
        return z_scores;
    }

    for (const double val : values) {
        z_scores.push_back((val - mean) / std_dev);
    }
    return z_scores;
}

} // namespace homeresource

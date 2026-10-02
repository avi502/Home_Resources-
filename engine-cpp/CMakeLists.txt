cmake_minimum_required(VERSION 3.14)
project(homeresource_cpp_engine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

# Fast vectorized calculations for high-frequency smart meter readings
add_library(homeresource_core STATIC
    src/algorithms.cpp
)

# Optional pybind11 integration when building python extension module
# find_package(pybind11 REQUIRED)
# pybind11_add_module(homeresource_cpp bindings/python_bindings.cpp)
# target_link_libraries(homeresource_cpp PRIVATE homeresource_core)

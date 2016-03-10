// Use this function to extend an "inherited" prototype function
alexTown.extendFunction = function(base, extension) {
    base = (function(_super) {
        return function() {
            //extension logic
            extension();

            return _super.apply(this, arguments);
        };
    })(base);
};
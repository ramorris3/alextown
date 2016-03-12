// Use this function to extend an "inherited" prototype function
alexTown.extendFunction = function(base, extension) {
    console.log('extended function');
    base = (function(_super) {
        return function() {
            //extension logic
            extension();
            console.log('updating charger');
            return _super.apply(this, arguments);
        };
    })(base);
};
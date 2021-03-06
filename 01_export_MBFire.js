var geometry = 
    ee.Geometry.Polygon(
        [[[-74.02555573040577, 5.724132001638358],
          [-74.02555573040577, -34.36255478537683],
          [-33.59586823040577, -34.36255478537683],
          [-33.59586823040577, 5.724132001638358]]], null, false);

// DATASET
var fire = ee.Image('projects/mapbiomas-workspace/public/collection6/mapbiomas-fire-collection1-annual-burned-coverage-1')
  .gte(1)
  .unmask(0);
  
var years = [ 
  1985, 1986,1987,1988,1989,1990,1991,1992,1993,1994,
  1995,1996,1997,1998,1999,
  2000,
  2001,
  2002,
  2003,2004,
  2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,
  2015,2016,2017,
  2018,
  2019,
  2020
  ];

var startYear = 1985;
var endYear = 2020;


years.forEach(function(year){
  
  var yearPost = year +1;
  
  // var year_actual = fire.select('burned_coverage_'+yearPost);
  var fire_actual_year = fire.select('burned_coverage_'+year).unmask(0);

  var list_years_prev = ee.List.sequence(startYear,year-1,1);
  
  var years_prev = list_years_prev
    .iterate(function(current,previous){
      current = ee.Number(current).int();
      var fire_year = fire
        .select(ee.String('burned_coverage_').cat(current))
        .multiply(current);
      
      return ee.Image(previous)
        .addBands(fire_year);
        
    },ee.Image().select());
  
  years_prev = ee.Image(years_prev);
  
  var year_prev_max = years_prev.reduce('max');

  var year_prev_sum =  list_years_prev
    .iterate(function(current,previous){
      var band = ee.String('burned_coverage_').cat(ee.Number(current).int());
      var img = fire
        .select(band);
      return ee.Image(previous)
        .addBands(img);
    },
    ee.Image().select());
  
  year_prev_sum = ee.Image(year_prev_sum);
  
  var year_prev_freq = year_prev_sum.reduce('sum').divide(year - startYear);

  // Map.addLayer(year_prev_max,{},'year_prev_max');
  // Map.addLayer(year_prev_freq,{},'year_prev_freq');


  var list_years_post = ee.List.sequence(year+1,endYear,1);
  print('list_years_post',list_years_post)
  var years_post = list_years_post
     .iterate(function(current,previous){
      current = ee.Number(current).int();
      var fire_year = fire
        .select(ee.String('burned_coverage_').cat(current))
        .multiply(current);
      
      return ee.Image(previous)
        .addBands(fire_year);
        
    },ee.Image().select());
  
  years_post = ee.Image(years_post);

  var year_post_min = years_post.selfMask().reduce('min').unmask(0);

  var year_post_sum =  list_years_post
    .iterate(function(current,previous){
      var band = ee.String('burned_coverage_').cat(ee.Number(current).int());
      var img = fire
        .select(band);
      return ee.Image(previous)
        .addBands(img);
    },ee.Image().select());
    
    
  year_post_sum = ee.Image(year_post_sum);
  // print('year_post_sum',year_post_sum)
  var year_post_freq = year_post_sum.reduce('sum').divide(endYear - (year));

  // Map.addLayer(year_post_min,{},'year_post_min');
  // Map.addLayer(year_post_freq,{},'year_post_freq');
  // Map.addLayer(year_prev_max,{},'year_post_max');
  // Map.addLayer(year_post_freq,{},'year_post_freq');
  // Map.addLayer(fire_actual_year,{},'fire_actual_year');
  Map.addLayer(fire,{},'fire  ', false);
  
  
  var output = 'projects/mapbiomas-workspace/FOGO/MODELAGEM/fire-and-freq-prev-post-v1/';
  
  var image =   year_prev_max.rename('fire_prev')
      .addBands(year_prev_freq.rename('freq_prev'))
      .addBands(year_post_min.rename('fire_post'))
      .addBands(year_post_freq.rename('freq_post'))
      .addBands(fire_actual_year.rename('fire_year'))
      .addBands(ee.Image(year).rename('year'))
      .set({
        'year':year,
        'system:time_start':ee.Date(''+year+'-01-01').millis(),
        'system:time_end':ee.Date(''+(year+1)+'-01-01').millis()
      }); 
  
  Map.addLayer(image,{},'export_image', false);
  
  var description = '' + year;
  
  Export.image.toAsset({
    image:image,
      description:'fire-and-freq-prev-post-v1-'+description,
    assetId:output + description,
    pyramidingPolicy:'mode',
    // dimensions:,
    region:geometry,
    scale:30,
    // crs:,
    // crsTransform:,
    maxPixels:1e11,
    // shardSize:
  });
});

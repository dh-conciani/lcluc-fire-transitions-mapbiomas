## get outliers from samples
## dhemerson.costa@ipam.org.br // wallace.silva@ipam.org.br

## get libraries
library(ggplot2)
library(reshape2)
library(scico)

## avoid scientific notation
options(scipen= 999)

## set root
root <- './table/matopiba/'

## list files
files <- list.files(root, full.names= TRUE)

## stack and buid data
## create recipe
recipe <- as.data.frame(NULL)
for (i in 1:length(files)) {
  ## read file [i]
  x <- read.csv2(files[i], sep=',', dec='.')
  ## remove unnecessary columns
  x <- x[ , !names(x) %in% c("system.index",".geo")] 
  ## stack
  recipe <- rbind(x, recipe)
  rm(x)
}

## compute fire-age pre and post transition 
recipe$age_pre <- (recipe$year - recipe$fire_prev)*-1
recipe$age_post <- (recipe$fire_post - recipe$year)

## melt table
age <- melt(recipe[, c('age_pre', 'age_post', 'year')],
            id.vars=c('year'))

# get subsample
z <- age[ sample(seq(1, nrow(age)), size= 2000000) ,]

## plot
ggplot(data= z, mapping= aes(x= as.factor(year), y= as.integer(value))) +
  geom_bin2d(bins=60) +
  scico::scale_fill_scico(palette = "lajolla") + 
  theme_minimal() +
  coord_flip() +
  ylab('Time (years)') +
  ggtitle('Fire temporally closer to the transition (per pixel)') + 
  xlab(NULL) +
  scale_x_discrete(limits= rev) +
  geom_hline(yintercept = 0, col= 'black', size=1) +
  geom_hline(yintercept = -5.5, col= 'gray60', size=1, linetype='dashed') +
  geom_hline(yintercept = 5.5, col= 'gray60', size=1, linetype='dashed')

## burned area in the year opf transition 
burned <- as.data.frame(table(recipe[, c('fire_year', 'year')]))

## plot
ggplot(data= burned, mapping= aes(x= year, y= Freq, fill= fire_year)) +
  geom_bar(stat='identity') +
  coord_flip() +
  scale_x_discrete(limits= rev) +
  theme_minimal() +
  xlab(NULL) +
  ylab('N. of pixels') +
  scale_fill_manual(NULL, values=c('gray70', 'tomato'), labels=c('Unburned', 'Burned')) +
  ggtitle('Burned in the transition year?')

## plot histogrma of fire frequency 
freq <- melt(recipe[, c('freq_prev', 'freq_post')])
z <- freq[ sample(seq(1, nrow(freq)), size= 500000) ,]

## remove outliers (errors)
z <- subset(z, value <0.99)

## plot
ggplot(data= z, mapping=aes(x= value, fill=variable)) +
  geom_density(alpha=0.6,adjust=10) +
  scale_fill_manual(values=c('darkgreen', 'deepskyblue1'), labels=c('Before', 'After')) +
  geom_vline(xintercept= mean(subset(z, variable== 'freq_prev')$value), col='darkgreen', linetype='dashed') +
  geom_vline(xintercept= mean(subset(z, variable== 'freq_post')$value), col='deepskyblue1', linetype='dashed') +
  theme_classic() +
  ggtitle('Did the fire frequency change after the transition?')
  

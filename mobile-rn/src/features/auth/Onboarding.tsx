import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassSurface, MiroirButton, Screen } from '../../components/ui';
import { useSession } from '../../stores/session';
import { colors, typography } from '../../theme/tokens';
const slides = [
  {title:'Find pieces with a story',body:'Explore boutique collections, compare materials and available sizes, and save the pieces you love.',tag:'Discover boutiques',preview:'Your next favorite',accent:colors.accentSoft,secondary:colors.canvas,icon:'storefront' as const},
  {title:'Talk to the shop behind the piece',body:'Ask about fabric, sizing or an order in a conversation linked to the product. Keep your bag, delivery and returns together.',tag:'Shop with context',preview:'From question to order',accent:colors.panel,secondary:colors.accentSoft,icon:'chat-bubble-outline' as const},
  {title:'Your boutique, in your pocket',body:'For shop owners: manage product variants and stock, follow orders, and respond to customers from a dedicated workspace.',tag:'For boutique owners',preview:'Your daily workspace',accent:colors.accentSoft,secondary:colors.panel,icon:'inventory-2' as const},
];
export function Onboarding() {
  const [index,setIndex] = useState(0);
  const rail = useRef<ScrollView>(null);
  const {width,height} = useWindowDimensions();
  const pageWidth = (Math.min(width,600)-40)*0.92;
  const complete = () => void useSession.getState().completeOnboarding();
  function go(next:number) {setIndex(next);rail.current?.scrollTo({x:next*pageWidth,animated:true});}
  return <Screen scrollable={false} contentStyle={styles.screen}>
    <LinearGradient colors={['#FAFBFC','#F3F6F9']} style={StyleSheet.absoluteFill}/>
    <View style={[styles.orb,{top:-30,left:-20,backgroundColor:'#E4F1D7'}]}/><View style={[styles.orb,{top:180,right:-70,backgroundColor:'#F4EAFB'}]}/>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={index ? 'Previous' : 'MIROIR'} disabled={!index} onPress={() => go(index-1)} style={styles.iconButton}><MaterialIcons name={index ? 'chevron-left' : 'diamond'} size={20} color={colors.ink}/></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={complete} style={styles.skip}><Text style={{color:colors.accentStrong}}>Skip</Text></Pressable>
    </View>
    <ScrollView ref={rail} horizontal showsHorizontalScrollIndicator={false} snapToInterval={pageWidth} decelerationRate="fast" style={{flex:1}} contentContainerStyle={{paddingLeft:14,paddingRight:14}} onMomentumScrollEnd={event => setIndex(Math.min(2,Math.max(0,Math.round(event.nativeEvent.contentOffset.x/pageWidth))))}>
      {slides.map((slide,i) => <View key={slide.tag} style={{width:pageWidth,paddingRight:10}} accessibilityElementsHidden={i!==index} importantForAccessibility={i===index?'auto':'no-hide-descendants'}>
        <GlassSurface radius={34} padding={22} style={{flex:1,gap:0}} backgroundColor="rgba(255,255,255,0.66)">
          <View style={styles.row}><View style={styles.tag}><Text style={styles.tagText}>{slide.tag}</Text></View><View style={styles.iconButton}><MaterialIcons name={slide.icon} size={20} color={colors.ink}/></View></View>
          <LinearGradient colors={[slide.accent,slide.secondary]} style={[styles.preview,{height:Math.max(144,Math.min(220,height*0.26))}]}>
            <View style={styles.phone}><View style={styles.notch}/><View style={styles.phoneHeader}><Text style={styles.phoneTitle}>{slide.preview}</Text><MaterialIcons name={slide.icon} size={16} color={colors.ink}/></View><View style={styles.phoneCard}/><View style={styles.phoneCta}><MaterialIcons name={slide.icon} size={14} color="white"/><Text numberOfLines={1} style={styles.phoneCtaText}>Get started</Text></View></View>
          </LinearGradient>
          <Text style={[typography.headlineMedium,{marginTop:18}]}>{slide.title}</Text><Text style={[typography.bodyLarge,{marginTop:8}]}>{slide.body}</Text>
        </GlassSurface>
      </View>)}
    </ScrollView>
    <View accessibilityLabel={`Step ${index+1} of 3`} style={[styles.row,{marginVertical:18}]}><View style={{flexDirection:'row',gap:8}}>{slides.map((_,i)=><View key={i} style={{height:10,width:index===i?28:10,borderRadius:99,backgroundColor:index===i?colors.ink:colors.line}}/>)}</View><Text style={typography.bodySmall}>{index+1}/3</Text></View>
    <GlassSurface radius={26} padding={18} style={styles.footer} backgroundColor="rgba(255,255,255,0.75)"><View style={{flex:1,gap:6}}><Text style={typography.titleMedium}>{slides[index].preview}</Text><Text style={typography.bodyMedium}>Swipe through the intro or continue with the next step.</Text></View><MiroirButton label={index===2?'Get started':'Next'} icon="chevron-right" style={{minWidth:138}} onPress={index===2?complete:()=>go(index+1)}/></GlassSurface>
  </Screen>;
}
const styles=StyleSheet.create({
  screen:{padding:20,paddingTop:14,paddingBottom:24,maxWidth:600,width:'100%',alignSelf:'center',overflow:'hidden'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},orb:{position:'absolute',width:180,height:180,borderRadius:100,opacity:0.25},
  iconButton:{width:44,height:44,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.72)',borderWidth:1,borderColor:'white'},skip:{minHeight:44,paddingHorizontal:16,justifyContent:'center',borderRadius:99,backgroundColor:'rgba(255,255,255,0.68)'},
  tag:{borderRadius:99,paddingHorizontal:12,paddingVertical:8,backgroundColor:'rgba(255,255,255,0.7)'},tagText:{fontSize:12,fontWeight:'600',color:colors.ink},preview:{marginTop:18,borderRadius:30,alignItems:'center',justifyContent:'center'},
  phone:{width:120,height:192,borderRadius:28,padding:12,backgroundColor:'rgba(255,255,255,0.85)',boxShadow:'0 14px 28px rgba(83,107,57,0.10)',gap:8},notch:{alignSelf:'center',height:12,width:58,borderRadius:99,backgroundColor:colors.ink},phoneHeader:{flexDirection:'row',alignItems:'center',backgroundColor:'#F1F2EF',borderRadius:18,padding:10,gap:4},phoneTitle:{fontSize:13,fontWeight:'600',color:colors.ink,flex:1},phoneCard:{flex:1,backgroundColor:'white',borderRadius:16},phoneCta:{flexDirection:'row',gap:5,padding:10,borderRadius:99,backgroundColor:colors.ink},phoneCtaText:{fontSize:12,fontWeight:'700',color:'white',flex:1},footer:{flexDirection:'row',gap:12,alignItems:'center'},
});

var paso = 1/60,
    total = 150000,
    escena, camara, renderizador, controles,
    luzAmbiental, luzDireccional,
    lienzoTexto, ctxTexto, pixeles=[],
    grupoTexto, cubos=[],
    mostrar=false,
    tiempo=0,
    confeti;
    escalaX = 10 / window.innerWidth;
    escalaY = 5 / 200;

iniciar();
animar();

var animacionEjecutada = false;



function iniciar(){
  crearEscena();
  crearLuces();
  crearControles();
  crearConfeti();
  prepararTexto();
  manejarEntrada();
  window.addEventListener('resize', ajustar,false);
}

function crearEscena(){
  escena = new THREE.Scene();
  var cont = document.getElementById('escena');
  camara = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight,0.1,2000);
  camara.position.set(0,1.5,6);
  camara.lookAt(new THREE.Vector3(0,1.5,0));
  renderizador = new THREE.WebGLRenderer({alpha:false,premultipliedAlpha:false});
  renderizador.setSize(window.innerWidth,window.innerHeight);
  renderizador.setClearColor(0xf5f5f5,1);
  cont.appendChild(renderizador.domElement);
}

function crearLuces(){
  luzAmbiental = new THREE.AmbientLight(0xffffff, 0.6);
  escena.add(luzAmbiental);
  luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
  luzDireccional.position.set(0, 1, 1);
  escena.add(luzDireccional);
}

function crearControles(){
  controles = new THREE.OrbitControls(camara, renderizador.domElement);
}

function crearConfeti(){
  var geo = new THREE.BufferGeometry();
  var quads = total,
      tris = quads*2,
      chunk = 21845,
      pos = new Float32Array(tris*3*3),
      anim = new Float32Array(tris*3*2),
      trans = new Float32Array(tris*3*3),
      c0 = new Float32Array(tris*3*3),
      c1 = new Float32Array(tris*3*3),
      giro = new Float32Array(tris*3*4),
      fcol = new Float32Array(tris*3*3),
      bcol = new Float32Array(tris*3*3),
      ind = new Uint16Array(tris*3);
  
  geo.addAttribute('index', new THREE.BufferAttribute(ind,1));
  geo.addAttribute('anim', new THREE.BufferAttribute(anim,2));
  geo.addAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.addAttribute('desplazamiento', new THREE.BufferAttribute(trans,3));
  geo.addAttribute('control0', new THREE.BufferAttribute(c0,3));
  geo.addAttribute('control1', new THREE.BufferAttribute(c1,3));
  geo.addAttribute('giro', new THREE.BufferAttribute(giro,4));
  geo.addAttribute('colorF', new THREE.BufferAttribute(fcol,3));
  geo.addAttribute('colorT', new THREE.BufferAttribute(bcol,3));

  for(let i=0;i<ind.length;i++){ind[i]=i%(3*chunk);}

  for(let i=0;i<anim.length;i+=12){
    let d=Math.random()*4,l=6+Math.random()*4;
    for(let j=0;j<12;j+=2){anim[i+j]=d;anim[i+j+1]=l;}
  }

  var hw=0.02,hh=hw*0.6,
      a=[-hw,hh,0], b=[hw,hh,0], c=[hw,-hh,0], d=[-hw,-hh,0], verts=[a,d,b,d,c,b];
  for(let i=0,v=0;i<pos.length;i+=18){
    v=0;
    for(let j=0;j<18;j+=3){pos[i+j]=verts[v][0];pos[i+j+1]=verts[v][1];pos[i+j+2]=verts[v][2];v++;}
  }

  for(let i=0;i<trans.length;i+=18){
    let phi=Math.random()*Math.PI*2,r=4,x=rand(-4,4),z=rand(-4,4),dx=x+r*Math.cos(phi)*Math.random(),dz=z+r*Math.sin(phi)*Math.random();
    for(let j=0;j<18;j+=3){trans[i+j]=dx;trans[i+j+1]=0;trans[i+j+2]=dz;}
  }

  for(let i=0;i<c0.length;i+=18){
    let cp0=[rand(-1,1),rand(6,10),rand(-1,1)],cp1=[rand(-8,8),rand(2,10),rand(-8,8)];
    for(let j=0;j<18;j+=3){c0[i+j]=cp0[0];c0[i+j+1]=cp0[1];c0[i+j+2]=cp0[2];c1[i+j]=cp1[0];c1[i+j+1]=cp1[1];c1[i+j+2]=cp1[2];}
  }

  for(let i=0;i<giro.length;i+=24){
    let ax=Math.random(),az=Math.random(),ang=Math.PI*rand(20,60),len=Math.sqrt(ax*ax+az*az);ax/=len;az/=len;
    for(let j=0;j<24;j+=4){giro[i+j]=ax;giro[i+j+1]=0;giro[i+j+2]=az;giro[i+j+3]=ang;}
  }

  var f=new THREE.Color(),t=new THREE.Color();
  for(let i=0;i<fcol.length;i+=18){
    let h=Math.random();f.setHSL(h,1.0,0.5);t.setHSL(h,0.65,0.5);
    for(let j=0;j<18;j+=3){fcol[i+j]=f.r;fcol[i+j+1]=f.g;fcol[i+j+2]=f.b;bcol[i+j]=t.r;bcol[i+j+1]=t.g;bcol[i+j+2]=t.b;}
  }

  for(let i=0;i<tris/chunk;i++){
    geo.drawcalls.push({start:i*chunk*3,index:i*chunk*3,count:Math.min(tris-(i*chunk),chunk)*3});
  }

  var attr={anim:{type:"v2",value:null},desplazamiento:{type:"v3",value:null},control0:{type:"v3",value:null},control1:{type:"v3",value:null},giro:{type:"v4",value:null},colorF:{type:"c",value:null},colorT:{type:"c",value:null}},
      uni={tiempo:{type:"f",value:0}};
  var material=new THREE.ShaderMaterial({attributes:attr,uniforms:uni,vertexShader:document.getElementById('vs').textContent,fragmentShader:document.getElementById('fs').textContent,side:THREE.DoubleSide});
  confeti=new THREE.Mesh(geo,material);
  confeti.material.uniforms=uni;
  escena.add(confeti);
}

function prepararTexto(){
  lienzoTexto=document.getElementById('texto');
  ctxTexto=lienzoTexto.getContext('2d');
  lienzoTexto.width=window.innerWidth;
  lienzoTexto.height=200;
  actualizarTexto();
}

function manejarEntrada(){
  document.getElementById('entrada').addEventListener('keyup',actualizarTexto);
}

// ✅ FUNCIÓN CORREGIDA
function actualizarTexto(){
  if(!ctxTexto)return;
  var msg=document.getElementById('entrada').value||'DESEAMOS QUE HAYAS DISFRUTADO ESTA EXPERIENCIA';
  var s=window.innerWidth/(msg.length*0.8);
  if(s>160)s=160;
  
  ctxTexto.font='700 '+s+'px Arial';
  ctxTexto.clearRect(0,0,lienzoTexto.width,lienzoTexto.height);
  ctxTexto.textAlign='center';
  ctxTexto.textBaseline='middle';
  ctxTexto.fillStyle = '#000000'; // Asegurar color negro
  ctxTexto.fillText(msg.toUpperCase(),lienzoTexto.width/2,lienzoTexto.height/2);
  
  var datos=ctxTexto.getImageData(0,0,lienzoTexto.width,lienzoTexto.height).data;
  pixeles=[];
  
  // ✅ CORRECCIÓN: Detectar píxeles correctamente
  for(let i=0;i<datos.length;i+=4){
    // Verificar canal alfa (transparencia)
    if(datos[i+3] > 128){ // Si el píxel no es transparente
      let x=(i/4)%lienzoTexto.width;
      let y=Math.floor((i/4)/lienzoTexto.width);
      
      // Reducir densidad para mejor rendimiento
      if(x%2===0 && y%2===0){
        pixeles.push({
          x: x,
          y: y
        });
      }
    }
  }
  
  console.log('Píxeles detectados:', pixeles.length); // Debug
}

// ✅ FUNCIÓN CUBO CORREGIDA
function Cubo(idx){
  this.rotX=Math.random()*0.05;
  this.rotY=Math.random()*0.05;
  this.obj=new THREE.Mesh(
    new THREE.BoxGeometry(0.03,0.05,0.07), // Cubos más grandes
    new THREE.MeshLambertMaterial({
      color:new THREE.Color().setHSL(Math.random(),0.8,0.7)
    })
  );
  this.destino=new THREE.Vector3();
}

Cubo.prototype.ini=function(i){
  // ✅ CORRECCIÓN: Mejor cálculo de posición
  let pixel = pixeles[i];
  let x = (pixel.x - lienzoTexto.width/2) * (8 / lienzoTexto.width);
  let y = (lienzoTexto.height/2 - pixel.y) * (4 / lienzoTexto.height);
	
  this.destino.set(x, y + 1.5, 0);
  this.obj.position.copy(posAleatoria(new THREE.Vector3()));
};

Cubo.prototype.act=function(){
  if(this.obj.position.distanceTo(this.destino) > 0.05){
    this.obj.rotation.x+=this.rotX;
    this.obj.rotation.y+=this.rotY;
    this.obj.position.lerp(this.destino,0.03);
		
  }else{
    this.obj.position.copy(this.destino);
    this.obj.rotation.set(0,0,0);
    this.obj.material.color.set(0xff3333);
		
  }
};

function posAleatoria(v){
  let radio=15,r=5+radio*Math.random(),ang=Math.random()*Math.PI*2;
  v.x=r*Math.cos(ang);
  v.y=r*Math.sin(ang);
  v.z=Math.random()*10-5;
  return v;
}

function crearCubos(){
  if(grupoTexto){
    escena.remove(grupoTexto);
  }
  
  grupoTexto=new THREE.Object3D();
  cubos=[];
  
  console.log('Creando cubos para', pixeles.length, 'píxeles'); // Debug
  
  for(let i=0;i<pixeles.length;i++){
    let c=new Cubo(i);
    c.ini(i);
    grupoTexto.add(c.obj);
    cubos.push(c);
  } 
  escena.add(grupoTexto);
}

function actualizarCubos(){
  for(let i=0;i<cubos.length;i++){
    cubos[i].act();
  }
}

// ✅ FUNCIÓN ANIMAR CORREGIDA
function animar(){
  if(animacionEjecutada) return;
  
  requestAnimationFrame(animar);
  tiempo += paso;

  if(tiempo >= 14){
    animacionEjecutada = true;
    
    // Limpiar toda la escena
    if(grupoTexto){
      escena.remove(grupoTexto);
      grupoTexto = null;
    }
    // ✅ MANTENER el texto sólido visible al final
    // No remover textoSolido aquí
    //cubos = [];
    //mostrar = false;
    //letrasSolidasMostradas = false;
    //return;
  }

  confeti.material.uniforms.tiempo.value = tiempo;

  // Mostrar letras de confeti entre segundo 8 y 15
  if(!mostrar && tiempo > 7 && tiempo < 15){
    mostrar = true;
    actualizarTexto();
    crearCubos();
  }
  
  if(mostrar){
    actualizarCubos();
    // Ocultar texto después del segundo 10
    if(tiempo >= 15){
      if(grupoTexto){
        escena.remove(grupoTexto);
        grupoTexto = null;
      }
			material = 0;
      cubos=[];
      mostrar=false;
    }
  }
  
  controles.update();
  renderizador.render(escena,camara);
}

function ajustar(){
  camara.aspect=window.innerWidth/window.innerHeight;
  camara.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth,window.innerHeight);
  lienzoTexto.width=window.innerWidth;
  lienzoTexto.height=200;
  actualizarTexto();
  escalaX = 10 / window.innerWidth;
  escalaY = 5 / 200;
}

function rand(a,b){
  return Math.random()*(b-a)+a;
}

clear;
cla;
clf
escala = 3.7;

axis square
xlim([-escala,escala])
ylim([-escala,escala])
hold on

dr=0.04;
dt=0.3;

r_limite = 15;
t_limite = 9;

% ZONA I
for r=1.0000001:dr:r_limite
    espacio = [];
    tiempo = [];
    for t=-t_limite:dt:t_limite
        X = sqrt(r-1)*exp(0.5*r)*cosh(0.5*t);
        T = sqrt(r-1)*exp(0.5*r)*sinh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'Color',[0 0.4 0.6])
    hold on 
end

for t=-t_limite:dt:t_limite
    espacio = [];
    tiempo = [];
    for r=1.00001:dr:r_limite
        X = sqrt(r-1)*exp(0.5*r)*cosh(0.5*t);
        T = sqrt(r-1)*exp(0.5*r)*sinh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'r')
end

% ZONA II
for r=0.999999:-dr:0.00001
    espacio = [];
    tiempo = [];
    for t=-t_limite:dt:t_limite
        X = sqrt(1-r)*exp(0.5*r)*sinh(0.5*t);
        T = sqrt(1-r)*exp(0.5*r)*cosh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'Color',[0 0.4 0.6])
end

for t=-t_limite:dt:t_limite
    espacio = [];
    tiempo = [];
    for r=0.999999:-dr:0.00001
        X = sqrt(1-r)*exp(0.5*r)*sinh(0.5*t);
        T = sqrt(1-r)*exp(0.5*r)*cosh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'r')
end

% ZONA III
for r=1.00001:dr:r_limite
    espacio = [];
    tiempo = [];
    for t=-t_limite:dt:t_limite
        X = -sqrt(r-1)*exp(0.5*r)*cosh(-0.5*t);
        T = -sqrt(r-1)*exp(0.5*r)*sinh(-0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'Color',[0 0.4 0.6])
end

for t=-t_limite:dt:t_limite
    espacio = [];
    tiempo = [];
    for r=1.00001:dt:r_limite
    X = -sqrt(r-1)*exp(0.5*r)*cosh(-0.5*t);
    T = -sqrt(r-1)*exp(0.5*r)*sinh(-0.5*t);
    p=X+T;
    q=-X+T;
    u=atan(p);
    v=atan(q);
    tao = u+v;
    R = u-v;
    espacio = [espacio ; R];
    tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'r')
end 

% ZONA IV
for r=0.999999:-dr:0.00001
    espacio = [];
    tiempo = [];
    for t=-t_limite:dt:t_limite
        X = -sqrt(1-r)*exp(0.5*r)*sinh(0.5*t);
        T = -sqrt(1-r)*exp(0.5*r)*cosh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'Color',[0 0.4 0.6])
end

for t=-t_limite:dt:t_limite
    espacio = [];
    tiempo = [];
    for r=0.999999:-dr:0.00001
        X = -sqrt(1-r)*exp(0.5*r)*sinh(0.5*t);
        T = -sqrt(1-r)*exp(0.5*r)*cosh(0.5*t);
        p=X+T;
        q=-X+T;
        u=atan(p);
        v=atan(q);
        tao = u+v;
        R = u-v;
        espacio = [espacio ; R];
        tiempo = [tiempo ; tao];
    end
    plot(espacio,tiempo,'r')
end

text(3.2,0,'i0','FontSize',14)
text(1.5,1.7,'i+','FontSize',14)
text(1.5,-1.7,'i-','FontSize',14)
text(2.4,1,'I+','FontSize',14)
text(2.4,-1,'I-','FontSize',14)

text(-3.4,0,'i0','FontSize',14)
text(-1.5,1.7,'i+','FontSize',14)
text(-1.5,-1.7,'i-','FontSize',14)
text(-2.4,1,'I+','FontSize',14)
text(-2.4,-1,'I-','FontSize',14)

% Singularidad
Tup=[];
Tdown=[];
X=[];

for s = -pi/2:0.1:pi/2
    T_aux = pi/2;
    X_aux = s;
    Tup = [Tup ; T_aux];
    Tdown = [Tdown ; -T_aux];
    X = [X ; X_aux];
end
plot(X,Tup,'*g')
plot(X,Tdown,'*g')


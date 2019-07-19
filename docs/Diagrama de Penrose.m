clear;clc;clf
% Ejes
axis square
xlim([-1.2,1.2])
ylim([-1.2,1.2])

hold on

for r = 0:0.1:5
    T=[];
    X=[];
    for t=-10:0.1:10
        T_aux = 0.5 * ( tanh(t + r) + tanh(t - r));
        X_aux = 0.5 * ( tanh(t + r) - tanh(t - r));
        T = [T ; T_aux];
        X = [X ; X_aux];
    end
    plot(X,T,'b')
end

for t = -5:0.1:5
    T=[];
    X=[];
    for r = 0:0.1:5
        T_aux = 0.5 * ( tanh(t + r) + tanh(t - r));
        X_aux = 0.5 * ( tanh(t + r) - tanh(t - r));
        T = [T ; T_aux];
        X = [X ; X_aux];
    end
    plot(X,T,'r')
end

text(1.05,0,'i0','FontSize',14)
text(0,1.05,'i+','FontSize',14)
text(0,-1.05,'i-','FontSize',14)
text(0.55,0.55,'I+','FontSize',14)
text(0.55,-0.55,'I-','FontSize',14)

% Rayo de luz
T=[];
X=[];

for s = 0:0.1:5
    t = s;
    r = s;
    [T_aux,X_aux] = coord(t,r);
    T = [T ; T_aux];
    X = [X ; X_aux];
end
plot(X,T,'black')
